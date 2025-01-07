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
    console.log('Retrieved wallets from localStorage:', wallets); // Debugging log
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
    sendingAddressDisplay.textContent = `${selectedWallet.address}`;
    sendingAddressDisplay.className = 'styled-text'; // Use a class for styling

    // Create a label for the iframe
    const iframeLabel = document.createElement('div');
    iframeLabel.textContent = 'Select UTXOs to use';
    iframeLabel.className = 'iframe-label'; // Use a class for styling
    landingPage.appendChild(iframeLabel);

    // Create an iframe to list UTXOs (similar to viewUtxoUI)
    const iframe = document.createElement('iframe');
    iframe.className = 'scrollable-iframe';
    iframe.style.width = '300px';
    iframe.style.height = '200px';
    iframe.style.border = '1px solid #000';
    iframe.style.overflow = 'auto';
    landingPage.appendChild(iframe);

    // Write content into the iframe
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write('<html><body style="background-color: black; color: white;"></body></html>');
    doc.close();
    const iframeBody = doc.body;

    // Create checkboxes for UTXO selection within the iframe
    filteredUtxos.forEach((utxo, index) => {
        const utxoDiv = doc.createElement('div');
        utxoDiv.className = 'utxo-item';

        const utxoCheckbox = doc.createElement('input');
        utxoCheckbox.type = 'checkbox';
        utxoCheckbox.value = index;
        utxoCheckbox.className = 'utxo-checkbox';

        // Truncate TXID for display
        const truncatedTxid = `${utxo.txid.slice(0, 6)}...${utxo.txid.slice(-6)}`;
        const utxoLabel = doc.createElement('label');
        utxoLabel.textContent = `Value: ${utxo.value}`;

        utxoDiv.appendChild(utxoCheckbox);
        utxoDiv.appendChild(utxoLabel);
        utxoDiv.appendChild(doc.createElement('br'));
        iframeBody.appendChild(utxoDiv);
    });

    // Create dropdown for fee UTXO selection (in main document)
    const feeUtxoDropdown = document.createElement('select');
    feeUtxoDropdown.className = 'styled-select';
    filteredUtxos.forEach((utxo, index) => {
        const option = document.createElement('option');
        option.value = index;

        // Truncate TXID for display
        const truncatedTxid = `${utxo.txid.slice(0, 6)}...${utxo.txid.slice(-6)}`;
        option.textContent = `Value: ${utxo.value}`;
        feeUtxoDropdown.appendChild(option);
    });

    // Create input fields for transaction details (in main document)
    const recipientAddressInput = document.createElement('input');
    recipientAddressInput.type = 'text';
    recipientAddressInput.placeholder = 'Recipient Address';
    recipientAddressInput.className = 'styled-input';

    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.placeholder = 'Amount (coins)';
    amountInput.className = 'styled-input';
    amountInput.step = '0.00000001';

    // Fee slider instead of numeric text input
    const feeInput = document.createElement('input');
    feeInput.type = 'range';
    feeInput.className = 'styled-input';
    feeInput.min = '250000';
    feeInput.max = '10000000';
    feeInput.value = '1000000';
    feeInput.step = '10000';

    // Display for the selected fee amount
    const feeDisplay = document.createElement('div');
    feeDisplay.className = 'fee-display'; // for styling as needed
    feeDisplay.textContent = `Fee: ${feeInput.value} satoshis`;

    // Update fee amount display when slider changes
    feeInput.addEventListener('input', () => {
        feeDisplay.textContent = `Fee: ${feeInput.value} satoshis`;
    });

    // Send Button (in main document)
    const sendButton = document.createElement('button');
    sendButton.type = 'button';
    sendButton.textContent = 'Send';
    sendButton.className = 'styled-button';
    sendButton.addEventListener('click', () => {
        // Retrieve selected UTXOs from the iframe's document
        const checkedBoxes = Array.from(doc.querySelectorAll('.utxo-checkbox:checked'));
        const selectedUtxos = checkedBoxes.map(checkbox => {
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
        const uniqueSelectedUtxos = selectedUtxos.filter(
            utxo => utxo.txid !== feeUtxo.txid || utxo.vout !== feeUtxo.vout
        );

        console.log('Selected UTXOs:', uniqueSelectedUtxos);

        // Check for duplicate UTXOs
        const uniqueUtxos = new Set(uniqueSelectedUtxos.map(utxo => `${utxo.txid}:${utxo.vout}`));
        if (uniqueUtxos.size !== uniqueSelectedUtxos.length) {
            alert('Duplicate UTXOs detected. Please select different UTXOs.');
            return;
        }

        // Convert amount from whole coins to satoshis
        const amountToSend = parseFloat(amountInput.value) * 100000000; // Convert to satoshis

        const data = {
            recipient_address: recipientAddressInput.value.trim(),
            amount_to_send: Math.round(amountToSend), // Ensure it's an integer
            privkey: selectedWallet.privkey,
            fee_utxo_txid: feeUtxo.txid,
            fee_utxo_vout: feeUtxo.vout,
            fee_utxo_script: feeUtxo.script_hex,
            fee_utxo_satoshis: Math.round(feeUtxo.value * 100000000), // Convert to satoshis
            utxos: uniqueSelectedUtxos,
            // Use the selected slider value for fee
            fee: parseInt(feeInput.value, 10)
        };

        // Send request to create and sign transaction
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
                // Now broadcast the raw transaction
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
            // Borrowing the success handling approach from inscribeUI
            if (sendResult.status === 'success') {
                // The broadcast endpoint typically returns { status: 'success', data: { txid: .. } }
                if (sendResult.data && sendResult.data.txid) {
                    alert(`Transaction ID: ${sendResult.data.txid}`);
                } else {
                    // Fallback in case the format is different
                    alert(`Transaction broadcasted but no TXID returned. Full response: ${JSON.stringify(sendResult)}`);
                }
            } else {
                alert(sendResult.message);
            }
        })
        .catch(error => {
            console.error('Error sending transaction:', error);
            alert('An error occurred while sending the transaction.');
        });
    });

    // Back Button (in main document)
    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.textContent = 'Back';
    backButton.className = 'styled-button';
    backButton.addEventListener('click', () => {
        walletUI(); // Call the walletUI function to navigate back
    });

    // Append elements to landing page (except for the UTXOs which are in the iframe)
    landingPage.appendChild(sendingAddressDisplay);
    landingPage.appendChild(feeUtxoDropdown);
    landingPage.appendChild(recipientAddressInput);
    landingPage.appendChild(amountInput);

    // Place the fee display above the fee slider
    landingPage.appendChild(feeDisplay);
    landingPage.appendChild(feeInput);

    landingPage.appendChild(sendButton);
    landingPage.appendChild(backButton);
}
