import { walletUI } from './walletUI.js';

export function sendTxUI(selectedLabel) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Create and append the title
    const title = document.createElement('h1');
    title.textContent = 'Send Transaction';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Retrieve the selected wallet's UTXOs
    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
    const selectedWallet = wallets.find(wallet => wallet.label === selectedLabel);

    if (!selectedWallet || !selectedWallet.utxos) {
        const noUtxosMessage = document.createElement('div');
        noUtxosMessage.textContent = 'No UTXOs available.';
        noUtxosMessage.className = 'no-utxos-message'; // Use a class for styling
        landingPage.appendChild(noUtxosMessage);
        return;
    }

    // Filter UTXOs: value <= 0.01 for sending, value > 0.01 for fee
    const sendableUtxos = selectedWallet.utxos.filter(utxo => utxo.value <= 0.01 && utxo.confirmations >= 1);
    const feeUtxos = selectedWallet.utxos.filter(utxo => utxo.value > 0.01 && utxo.confirmations >= 1);

    if (sendableUtxos.length === 0) {
        const noUtxosMessage = document.createElement('div');
        noUtxosMessage.textContent = 'No UTXOs available with value 0.01 or less and sufficient confirmations.';
        noUtxosMessage.className = 'no-utxos-message'; // Use a class for styling
        landingPage.appendChild(noUtxosMessage);
        return;
    }

    if (feeUtxos.length === 0) {
        const noFeeUtxosMessage = document.createElement('div');
        noFeeUtxosMessage.textContent = 'No UTXOs available with value greater than 0.01 for fee.';
        noFeeUtxosMessage.className = 'no-utxos-message'; // Use a class for styling
        landingPage.appendChild(noFeeUtxosMessage);
        return;
    }

    // Display wallet details
    const sendingAddressDisplay = document.createElement('div');
    sendingAddressDisplay.textContent = `Sending Address: ${selectedWallet.address}`;
    sendingAddressDisplay.className = 'styled-text'; // Use a class for styling

    const wifPrivateKeyDisplay = document.createElement('div');
    wifPrivateKeyDisplay.textContent = `WIF Private Key: ${selectedWallet.privkey}`;
    wifPrivateKeyDisplay.className = 'styled-text'; // Use a class for styling

    const changeAddressDisplay = document.createElement('div');
    changeAddressDisplay.textContent = `Change Address: ${selectedWallet.address}`;
    changeAddressDisplay.className = 'styled-text'; // Use a class for styling

    // Create radio buttons for UTXO selection (only one can be selected)
    const utxoContainer = document.createElement('div');
    sendableUtxos.forEach((utxo, index) => {
        const utxoRadio = document.createElement('input');
        utxoRadio.type = 'radio';
        utxoRadio.name = 'utxo';
        utxoRadio.value = index;
        utxoRadio.className = 'utxo-radio';

        const utxoLabel = document.createElement('label');
        utxoLabel.textContent = `TXID: ${utxo.txid}, Value: ${utxo.value}`;

        utxoContainer.appendChild(utxoRadio);
        utxoContainer.appendChild(utxoLabel);
        utxoContainer.appendChild(document.createElement('br'));
    });

    // Create dropdown for fee UTXO selection
    const feeUtxoDropdown = document.createElement('select');
    feeUtxoDropdown.className = 'styled-select'; // Use a class for styling
    feeUtxos.forEach((utxo, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `TXID: ${utxo.txid}, Value: ${utxo.value}`;
        feeUtxoDropdown.appendChild(option);
    });

    // Create input fields for transaction details
    const recipientAddressInput = document.createElement('input');
    recipientAddressInput.type = 'text';
    recipientAddressInput.placeholder = 'Recipient Address';
    recipientAddressInput.className = 'styled-input'; // Use a class for styling

    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.placeholder = 'Amount (sats)';
    amountInput.className = 'styled-input'; // Use a class for styling

    const feeInput = document.createElement('input');
    feeInput.type = 'number';
    feeInput.placeholder = 'Fee (sats)';
    feeInput.className = 'styled-input'; // Use a class for styling

    // Send Button
    const sendButton = document.createElement('button');
    sendButton.type = 'button';
    sendButton.textContent = 'Send';
    sendButton.className = 'styled-button'; // Use a class for styling
    sendButton.addEventListener('click', () => {
        const selectedUtxoIndex = document.querySelector('.utxo-radio:checked')?.value;
        if (selectedUtxoIndex === undefined) {
            alert('Please select a UTXO to send.');
            return;
        }

        const selectedUtxo = sendableUtxos[selectedUtxoIndex];
        const feeUtxo = feeUtxos[feeUtxoDropdown.value];

        const data = {
            recipient_address: recipientAddressInput.value.trim(),
            amount_to_send: parseInt(amountInput.value, 10),
            privkey: selectedWallet.privkey,
            fee_utxo_txid: feeUtxo.txid,
            fee_utxo_vout: feeUtxo.vout,
            fee_utxo_script: feeUtxo.script_hex,
            fee_utxo_satoshis: Math.round(feeUtxo.value * 100000000), // Convert to satoshis
            utxos: [{
                txid: selectedUtxo.txid,
                vout: selectedUtxo.vout,
                script: selectedUtxo.script_hex,
                satoshis: Math.round(selectedUtxo.value * 100000000) // Convert to satoshis
            }]
        };

        fetch(`/api/v1/send/${selectedWallet.ticker}`, {
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
                alert(`Transaction Hex: ${result.transactionHex}`);
            } else {
                alert(result.message);
            }
        })
        .catch(error => {
            console.error('Error sending transaction:', error);
            alert('An error occurred while sending the transaction.');
        });
    });

    // Append elements to landing page
    landingPage.appendChild(sendingAddressDisplay);
    landingPage.appendChild(wifPrivateKeyDisplay);
    landingPage.appendChild(changeAddressDisplay);
    landingPage.appendChild(utxoContainer);
    landingPage.appendChild(feeUtxoDropdown);
    landingPage.appendChild(recipientAddressInput);
    landingPage.appendChild(amountInput);
    landingPage.appendChild(feeInput);
    landingPage.appendChild(sendButton);
}