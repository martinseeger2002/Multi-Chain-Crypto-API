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

    // Filter UTXOs: value > 0.01 and confirmations >= 1
    const filteredUtxos = selectedWallet.utxos.filter(utxo => utxo.value > 0.01 && utxo.confirmations >= 1);

    if (filteredUtxos.length === 0) {
        const noUtxosMessage = document.createElement('div');
        noUtxosMessage.textContent = 'No UTXOs available with sufficient value and confirmations.';
        noUtxosMessage.className = 'no-utxos-message'; // Use a class for styling
        landingPage.appendChild(noUtxosMessage);
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

    // Create checkboxes for UTXO selection
    const utxoContainer = document.createElement('div');
    filteredUtxos.forEach((utxo, index) => {
        const utxoCheckbox = document.createElement('input');
        utxoCheckbox.type = 'checkbox';
        utxoCheckbox.value = index;
        utxoCheckbox.className = 'utxo-checkbox';

        const utxoLabel = document.createElement('label');
        utxoLabel.textContent = `TXID: ${utxo.txid}, Value: ${utxo.value}`;

        utxoContainer.appendChild(utxoCheckbox);
        utxoContainer.appendChild(utxoLabel);
        utxoContainer.appendChild(document.createElement('br'));
    });

    // Create dropdown for fee UTXO selection
    const feeUtxoDropdown = document.createElement('select');
    feeUtxoDropdown.className = 'styled-select'; // Use a class for styling
    filteredUtxos.forEach((utxo, index) => {
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
        const selectedUtxos = Array.from(document.querySelectorAll('.utxo-checkbox:checked')).map(checkbox => {
            const utxo = filteredUtxos[checkbox.value];
            return {
                txid: utxo.txid,
                vout: utxo.vout,
                script: utxo.script_hex,
                satoshis: Math.round(utxo.value * 100000000) // Convert to satoshis
            };
        });

        const feeUtxoIndex = feeUtxoDropdown.value;
        const feeUtxo = filteredUtxos[feeUtxoIndex];

        // Ensure the fee UTXO is not included in the selected UTXOs
        const uniqueSelectedUtxos = selectedUtxos.filter(utxo => utxo.txid !== feeUtxo.txid || utxo.vout !== feeUtxo.vout);

        // Log selected UTXOs to check for duplicates
        console.log('Selected UTXOs:', uniqueSelectedUtxos);

        // Check for duplicate UTXOs
        const uniqueUtxos = new Set(uniqueSelectedUtxos.map(utxo => `${utxo.txid}:${utxo.vout}`));
        if (uniqueUtxos.size !== uniqueSelectedUtxos.length) {
            alert('Duplicate UTXOs detected. Please select different UTXOs.');
            return;
        }

        const data = {
            recipient_address: recipientAddressInput.value.trim(),
            amount_to_send: parseInt(amountInput.value, 10),
            privkey: selectedWallet.privkey,
            fee_utxo_txid: feeUtxo.txid,
            fee_utxo_vout: feeUtxo.vout,
            fee_utxo_script: feeUtxo.script_hex,
            fee_utxo_satoshis: Math.round(feeUtxo.value * 100000000), // Convert to satoshis
            utxos: uniqueSelectedUtxos
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
                const transactionHex = result.transactionHex;
                // Call send_raw_tx API with the transaction hex
                return fetch(`/api/v1/send_raw_tx/${selectedWallet.ticker}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': apiKey
                    },
                    body: JSON.stringify({ tx_hex: transactionHex })
                });
            } else {
                throw new Error(result.message);
            }
        })
        .then(response => response.json())
        .then(sendResult => {
            if (sendResult.status === 'success') {
                alert(`Transaction ID: ${sendResult.txid}`);
            } else {
                alert(sendResult.message);
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
