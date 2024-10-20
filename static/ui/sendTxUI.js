export function sendTxUI(selectedLabel) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Send Transaction';
    landingPage.appendChild(title);

    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
    const selectedWallet = wallets.find(wallet => wallet.label === selectedLabel);

    if (!selectedWallet) {
        alert('Wallet not found!');
        return;
    }

    const form = document.createElement('form');
    form.style.maxWidth = '300px';
    form.style.margin = '0 auto';
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.alignItems = 'center';

    const recipientsContainer = document.createElement('div');
    recipientsContainer.style.width = '100%';
    addRecipientInput(recipientsContainer);

    const addRecipientButton = document.createElement('button');
    addRecipientButton.type = 'button';
    addRecipientButton.textContent = 'Add Recipient';
    addRecipientButton.style.margin = '10px 0';
    addRecipientButton.addEventListener('click', () => addRecipientInput(recipientsContainer));

    const feeSlider = document.createElement('input');
    feeSlider.type = 'range';
    feeSlider.style.width = '100%';

    const feeDisplay = document.createElement('div');
    feeDisplay.style.margin = '10px 0';

    // Set fee range based on ticker
    if (selectedWallet.ticker === 'LTC') {
        feeSlider.min = 1000;
        feeSlider.max = 100000000;
        feeSlider.value = 1000;
    } else if (selectedWallet.ticker === 'LKY' || selectedWallet.ticker === 'DOGE') {
        feeSlider.min = 1000000;
        feeSlider.max = 100000000;
        feeSlider.value = 1000000;
    }

    feeDisplay.textContent = `Fee: ${feeSlider.value} sats`;

    feeSlider.addEventListener('input', () => {
        feeDisplay.textContent = `Fee: ${feeSlider.value} sats`;
    });

    const changeAddressInput = document.createElement('input');
    changeAddressInput.type = 'text';
    changeAddressInput.placeholder = 'Change Address';
    changeAddressInput.value = selectedWallet.address; // Set to sending wallet's address
    changeAddressInput.readOnly = true; // Make it read-only to prevent changes
    changeAddressInput.style.width = '100%';
    changeAddressInput.style.margin = '10px 0';

    const sendButton = document.createElement('button');
    sendButton.type = 'button';
    sendButton.textContent = 'Send';
    sendButton.style.margin = '10px 0';
    sendButton.addEventListener('click', generateTransactionHex);

    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.style.margin = '10px 0';
    backButton.addEventListener('click', walletUI);

    form.appendChild(recipientsContainer);
    form.appendChild(addRecipientButton);
    form.appendChild(feeSlider);
    form.appendChild(feeDisplay);
    form.appendChild(changeAddressInput);
    form.appendChild(sendButton);

    landingPage.appendChild(form);
    landingPage.appendChild(backButton);

    function addRecipientInput(container) {
        const recipientDiv = document.createElement('div');
        recipientDiv.style.width = '100%';
        recipientDiv.style.margin = '10px 0';

        const receivingAddressInput = document.createElement('input');
        receivingAddressInput.type = 'text';
        receivingAddressInput.placeholder = 'Receiving Address';
        receivingAddressInput.required = true;
        receivingAddressInput.style.width = '100%';
        receivingAddressInput.style.margin = '5px 0';

        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.placeholder = 'Amount';
        amountInput.required = true;
        amountInput.style.width = '100%';
        amountInput.style.margin = '5px 0';

        recipientDiv.appendChild(receivingAddressInput);
        recipientDiv.appendChild(amountInput);
        container.appendChild(recipientDiv);
    }

    function selectUtxos(amountNeeded) {
        const utxos = selectedWallet.utxos.filter(utxo => utxo.value > 0.01);
        utxos.sort((a, b) => a.value - b.value);

        let total = 0;
        const selectedUtxos = [];
        for (const utxo of utxos) {
            if (total >= amountNeeded) break;
            selectedUtxos.push(utxo);
            total += utxo.value;
        }

        if (total < amountNeeded) {
            alert('Not enough balance to cover the transaction and fee.');
            return null;
        }

        return selectedUtxos;
    }

    function generateTransactionHex() {
        const recipients = Array.from(recipientsContainer.children).map(div => ({
            address: div.children[0].value,
            amount: parseInt(div.children[1].value)
        }));

        const totalAmount = recipients.reduce((sum, recipient) => sum + recipient.amount, 0);
        const fee = parseInt(feeSlider.value);
        const amountNeeded = totalAmount + fee;

        const selectedUtxos = selectUtxos(amountNeeded);
        if (!selectedUtxos) return;

        const utxo = selectedUtxos[0]; // Use the first UTXO for simplicity

        const data = {
            txId: utxo.txid,
            outputIndex: utxo.vout,
            address: utxo.address,
            script: utxo.scriptPubKey,
            satoshis: utxo.value,
            privateKeyWIF: selectedWallet.privkey,
            fee,
            changeAddress: selectedWallet.address,
            receivingAddresses: recipients.map(recipient => ({
                address: recipient.address,
                amount: recipient.amount
            }))
        };

        console.log('Data being sent:', JSON.stringify(data));

        fetch(`/api/v1/generate_tx_hex/${selectedWallet.ticker}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                const transactionData = {
                    selectedLabel,
                    recipients,
                    fee,
                    changeAddress: data.changeAddress,
                    transactionHex: result.data.transaction_hex
                };
                confirmSendTxUI(transactionData);
            } else {
                alert(result.message);
            }
        })
        .catch(error => {
            console.error('Error generating transaction hex:', error);
            alert('An error occurred while generating the transaction hex.');
        });
    }
}
