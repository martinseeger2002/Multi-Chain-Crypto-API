import { walletUI } from './walletUI.js';

export function sendOrdUI(selectedLabel) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Create and append the title
    const title = document.createElement('h1');
    title.textContent = 'Send Ord';
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

    // Filter UTXOs for sending: value <= 0.01 and confirmations >= 1
    const filteredUtxos = selectedWallet.utxos.filter(
        utxo => utxo.confirmations >= 1 && utxo.value <= 0.01
    );

    if (filteredUtxos.length === 0) {
        const noSendUtxosMessage = document.createElement('div');
        noSendUtxosMessage.textContent = 'No UTXOs available for sending.';
        noSendUtxosMessage.className = 'no-utxos-message'; // Use a class for styling
        landingPage.appendChild(noSendUtxosMessage);
        return;
    }

    // Create radio buttons for UTXO selection
    const utxoContainer = document.createElement('div');
    filteredUtxos.forEach((utxo, index) => {
        const utxoRadio = document.createElement('input');
        utxoRadio.type = 'radio';
        utxoRadio.name = 'utxo-selection'; // Ensure all radios are part of the same group
        utxoRadio.value = index;
        utxoRadio.className = 'utxo-radio';

        const utxoLabel = document.createElement('label');
        utxoLabel.textContent = `TXID: ${utxo.txid}, Value: ${Math.round(utxo.value * 100000000)} sats`;

        utxoRadio.addEventListener('change', () => {
            // Update the amount display when a UTXO is selected
            amountDisplay.textContent = `Amount to Send: ${Math.round(
                utxo.value * 100000000
            )} sats`;
        });

        utxoContainer.appendChild(utxoRadio);
        utxoContainer.appendChild(utxoLabel);
        utxoContainer.appendChild(document.createElement('br'));
    });

    // Create a display for the amount to send
    const amountDisplay = document.createElement('div');
    amountDisplay.className = 'styled-text'; // Use a class for styling
    amountDisplay.textContent = 'Amount to Send: 0 sats'; // Initial text

    // Fee display (will be updated dynamically)
    const feeDisplay = document.createElement('div');
    feeDisplay.className = 'styled-text'; // Use a class for styling
    feeDisplay.textContent = `Fee: Calculating...`;

    // Display wallet details
    const sendingAddressDisplay = document.createElement('div');
    sendingAddressDisplay.textContent = `Sending Address: ${selectedWallet.address}`;
    sendingAddressDisplay.className = 'styled-text'; // Use a class for styling

    const changeAddressDisplay = document.createElement('div');
    changeAddressDisplay.textContent = `Change Address: ${selectedWallet.address}`;
    changeAddressDisplay.className = 'styled-text'; // Use a class for styling

    // Create input field for recipient address
    const recipientAddressInput = document.createElement('input');
    recipientAddressInput.type = 'text';
    recipientAddressInput.placeholder = 'Recipient Address';
    recipientAddressInput.className = 'styled-input'; // Use a class for styling

    // Send Button
    const sendButton = document.createElement('button');
    sendButton.type = 'button';
    sendButton.textContent = 'Send';
    sendButton.className = 'styled-button'; // Use a class for styling
    sendButton.addEventListener('click', async () => {
        const selectedUtxoRadio = document.querySelector('.utxo-radio:checked');
        if (!selectedUtxoRadio) {
            alert('Please select a UTXO.');
            return;
        }

        const selectedUtxo = filteredUtxos[selectedUtxoRadio.value];
        const selectedUtxos = [
            {
                txid: selectedUtxo.txid,
                vout: selectedUtxo.vout,
                script: selectedUtxo.script_hex,
                satoshis: Math.round(selectedUtxo.value * 100000000), // Convert to satoshis
            },
        ];

        // Amount to send (satoshis)
        const amountToSend = selectedUtxos[0].satoshis;

        // Fetch recommended fee rate
        const feeRate = await getRecommendedFeeRate(); // satoshis per byte

        // Estimate transaction size
        const numInputs = selectedUtxos.length + 1; // +1 for fee UTXO
        const numOutputs = 2; // recipient and change
        const transactionSize = estimateTransactionSize(numInputs, numOutputs);

        // Calculate dynamic fee
        const fixedFee = Math.ceil(transactionSize * feeRate);

        // Update fee display
        feeDisplay.textContent = `Fee: ${fixedFee.toLocaleString()} sats`;

        // Ensure the fee UTXO has enough value to cover the fixed fee
        const feeUtxo = selectedWallet.utxos.find(
            utxo =>
                Math.round(utxo.value * 100000000) >= fixedFee &&
                utxo.confirmations >= 1
        );

        if (!feeUtxo) {
            alert('No UTXOs available with sufficient value for the fee.');
            return;
        }

        // Total inputs in satoshis
        const totalInput =
            selectedUtxos[0].satoshis + Math.round(feeUtxo.value * 100000000);

        // Calculate the change
        const change = totalInput - amountToSend - fixedFee;

        if (change < 546) {
            alert(
                'The resulting change is below the dust limit. Adjust the amount to send or select different UTXOs.'
            );
            return;
        }

        const data = {
            recipient_address: recipientAddressInput.value.trim(),
            amount_to_send: amountToSend,
            privkey: selectedWallet.privkey,
            fee_utxo_txid: feeUtxo.txid,
            fee_utxo_vout: feeUtxo.vout,
            fee_utxo_script: feeUtxo.script_hex,
            fee_utxo_satoshis: Math.round(feeUtxo.value * 100000000),
            fixed_fee: fixedFee,
            change_address: selectedWallet.address,
            utxos: selectedUtxos,
        };

        // Validate input fields
        if (data.recipient_address === '') {
            alert('Recipient address cannot be empty.');
            return;
        }

        if (isNaN(data.amount_to_send) || data.amount_to_send <= 0) {
            alert('Amount to send must be a positive number.');
            return;
        }

        console.log('Received send request with parameters:', data); // Log the parameters

        try {
            const response = await fetch(
                `/api/v1/send/${selectedWallet.ticker}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': apiKey,
                    },
                    body: JSON.stringify(data),
                }
            );
            const result = await response.json();

            if (result.status === 'success') {
                const transactionHex = result.transactionHex;
                // Call send_raw_tx API with the transaction hex
                const sendResponse = await fetch(
                    `/api/v1/send_raw_tx/${selectedWallet.ticker}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-Key': apiKey,
                        },
                        body: JSON.stringify({ tx_hex: transactionHex }),
                    }
                );
                const sendResult = await sendResponse.json();

                if (sendResult.status === 'success') {
                    alert(
                        `Transaction sent successfully!\nTransaction ID: ${sendResult.txid}`
                    );
                } else {
                    alert(`Error sending transaction: ${sendResult.message}`);
                }
            } else {
                alert(`Error constructing transaction: ${result.message}`);
            }
        } catch (error) {
            console.error('Error sending transaction:', error);
            alert('An error occurred while sending the transaction.');
        }
    });

    // Back Button
    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.textContent = 'Back';
    backButton.className = 'styled-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        walletUI(); // Call the walletUI function to navigate back
    });

    // Append elements to landing page
    landingPage.appendChild(sendingAddressDisplay);
    landingPage.appendChild(changeAddressDisplay);
    landingPage.appendChild(utxoContainer);
    landingPage.appendChild(recipientAddressInput);
    landingPage.appendChild(amountDisplay); // Append the amount display
    landingPage.appendChild(feeDisplay); // Append the fee display
    landingPage.appendChild(sendButton);
    landingPage.appendChild(backButton); // Append the back button

    // Functions for fee estimation
    async function getRecommendedFeeRate() {
        // Use a higher standard fee rate if necessary
        return 2; // Adjusted fee rate in DOGE per byte
    }

    function estimateTransactionSize(numInputs, numOutputs) {
        // Ensure this calculation is correct
        return 10 + numInputs * 148 + numOutputs * 34;
    }
}
