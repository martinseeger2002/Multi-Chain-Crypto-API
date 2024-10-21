import { walletUI } from './walletUI.js';

// Helper Functions
/**
 * Converts Bitcoin (BTC) to Satoshis (sats).
 * @param {number|string} btc - The amount in BTC.
 * @returns {number} The equivalent amount in satoshis.
 */
function btcToSatoshis(btc) {
    return Math.round(parseFloat(btc) * 1e8);
}

/**
 * Converts Satoshis (sats) to Bitcoin (BTC).
 * @param {number|string} sats - The amount in satoshis.
 * @returns {number} The equivalent amount in BTC.
 */
function satoshisToBtc(sats) {
    return parseFloat(sats) / 1e8;
}

/**
 * Initializes the Send Transaction UI.
 * @param {string} selectedLabel - The label of the selected wallet.
 */
export function sendTxUI(selectedLabel) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Create and append the title
    const title = document.createElement('h1');
    title.textContent = 'Send Transaction';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Retrieve wallets from localStorage
    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
    const selectedWallet = wallets.find(wallet => wallet.label === selectedLabel);

    if (!selectedWallet) {
        alert('Wallet not found!');
        return;
    }

    // Create the transaction form
    const form = document.createElement('form');
    form.className = 'transaction-form'; // Use a class for styling

    // Recipients Container
    const recipientsContainer = document.createElement('div');
    recipientsContainer.className = 'recipients-container'; // Use a class for styling
    addRecipientInput(recipientsContainer);

    // Add Recipient Button
    const addRecipientButton = document.createElement('button');
    addRecipientButton.type = 'button';
    addRecipientButton.textContent = 'Add Recipient';
    addRecipientButton.className = 'styled-button'; // Use a class for styling
    addRecipientButton.addEventListener('click', () => addRecipientInput(recipientsContainer));

    // Fee Slider
    const feeSlider = document.createElement('input');
    feeSlider.type = 'range';
    feeSlider.className = 'fee-slider'; // Use a class for styling

    // Fee Display
    const feeDisplay = document.createElement('div');
    feeDisplay.className = 'fee-display'; // Use a class for styling

    // Set fee range based on ticker
    if (selectedWallet.ticker.toUpperCase() === 'LTC') {
        feeSlider.min = 1000;
        feeSlider.max = 100000000;
        feeSlider.value = 1000;
    } else if (['LKY', 'DOGE'].includes(selectedWallet.ticker.toUpperCase())) {
        feeSlider.min = 1000000;
        feeSlider.max = 100000000;
        feeSlider.value = 1000000;
    } else {
        // Default fee settings if ticker is unrecognized
        feeSlider.min = 1000;
        feeSlider.max = 100000000;
        feeSlider.value = 1000;
    }

    feeDisplay.textContent = `Fee: ${feeSlider.value} sats`;

    feeSlider.addEventListener('input', () => {
        feeDisplay.textContent = `Fee: ${feeSlider.value} sats`;
    });

    // Change Address Input
    const changeAddressInput = document.createElement('input');
    changeAddressInput.type = 'text';
    changeAddressInput.placeholder = 'Change Address';
    changeAddressInput.value = selectedWallet.address; // Set to sending wallet's address
    changeAddressInput.readOnly = true; // Make it read-only to prevent changes
    changeAddressInput.className = 'styled-input'; // Use a class for styling

    // Send Button
    const sendButton = document.createElement('button');
    sendButton.type = 'button';
    sendButton.textContent = 'Send';
    sendButton.className = 'styled-button'; // Use a class for styling
    sendButton.addEventListener('click', generateTransactionHex);

    // Back Button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button back-button'; // Use a class for styling
    backButton.addEventListener('click', walletUI);

    // Append elements to form
    form.appendChild(recipientsContainer);
    form.appendChild(addRecipientButton);
    form.appendChild(feeSlider);
    form.appendChild(feeDisplay);
    form.appendChild(changeAddressInput);
    form.appendChild(sendButton);

    // Append form and back button to landing page
    landingPage.appendChild(form);
    landingPage.appendChild(backButton);

    /**
     * Adds a new recipient input row to the recipients container.
     * @param {HTMLElement} container - The container to append the recipient input to.
     */
    function addRecipientInput(container) {
        const recipientDiv = document.createElement('div');
        recipientDiv.className = 'recipient-div'; // Use a class for styling

        const receivingAddressInput = document.createElement('input');
        receivingAddressInput.type = 'text';
        receivingAddressInput.placeholder = 'Receiving Address';
        receivingAddressInput.required = true;
        receivingAddressInput.className = 'styled-input'; // Use a class for styling

        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.placeholder = 'Amount (sats)';
        amountInput.required = true;
        amountInput.className = 'styled-input'; // Use a class for styling

        // Optional: Add a remove button for each recipient
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = 'Remove';
        removeButton.className = 'remove-button'; // Use a class for styling
        removeButton.addEventListener('click', () => {
            container.removeChild(recipientDiv);
        });

        recipientDiv.appendChild(receivingAddressInput);
        recipientDiv.appendChild(amountInput);
        recipientDiv.appendChild(removeButton);
        container.appendChild(recipientDiv);
    }

    /**
     * Selects UTXOs needed to cover the total amount and fee.
     * @param {number} amountNeeded - The total amount needed in satoshis.
     * @returns {Array|null} - The selected UTXOs or null if insufficient funds.
     */
    function selectUtxos(amountNeeded) {
        // Filter UTXOs with value >= 1 satoshi
        const utxos = selectedWallet.utxos.filter(utxo => utxo.value >= 1);
        // Sort UTXOs by value in ascending order
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

    /**
     * Generates the transaction hex by sending a request to the backend API.
     */
    function generateTransactionHex() {
        const recipients = Array.from(recipientsContainer.children).map(div => ({
            address: div.querySelector('input[placeholder="Receiving Address"]').value.trim(),
            amount: parseInt(div.querySelector('input[placeholder="Amount (sats)"]').value, 10)
        }));

        // Validate recipient inputs
        for (const recipient of recipients) {
            if (!recipient.address || isNaN(recipient.amount) || recipient.amount <= 0) {
                alert('Please provide valid recipient addresses and amounts.');
                return;
            }
        }

        const totalAmount = recipients.reduce((sum, recipient) => sum + recipient.amount, 0);
        const fee = parseInt(feeSlider.value, 10);
        const amountNeeded = totalAmount + fee;

        const selectedUtxos = selectUtxos(amountNeeded);
        if (!selectedUtxos) return;

        const utxos = selectedUtxos.map(utxo => ({
            txId: utxo.txid,
            vout: utxo.vout,
            amount: utxo.value, // Assuming utxo.value is already in sats
            scriptHash: utxo.scriptPubKey // Ensure scriptPubKey corresponds to scriptHash
        }));

        const data = {
            sendingAddress: selectedWallet.address,
            wifPrivateKey: selectedWallet.privkey,
            utxos: utxos,
            recipients: recipients,
            fee: fee,
            changeAddress: selectedWallet.address
        };

        console.log('Data being sent (in sats):', JSON.stringify(data));

        // Define the API key
        const apiKey = 'your_api_key_here'; // Replace with your actual API key

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
                    recipients: recipients.map(recipient => ({
                        address: recipient.address,
                        amount: satoshisToBtc(recipient.amount)
                    })),
                    fee: satoshisToBtc(fee),
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

    /**
     * Displays a confirmation UI for the generated transaction.
     * @param {object} transactionData - The transaction details.
     */
    function confirmSendTxUI(transactionData) {
        // Implement the confirmation UI logic here
        // For example:
        alert(`Transaction Hex: ${transactionData.transactionHex}`);
        // Or navigate to a confirmation page/modal
    }
}