import { mintFileUI } from './mintFileUI.js'; // Adjust the path as necessary

export function inscribeUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Inscribe Transactions';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Mint Credits Display
    const creditsDisplay = document.createElement('p');
    creditsDisplay.className = 'credits-display'; // Use a class for styling
    landingPage.appendChild(creditsDisplay);

    // Fetch and update mint credits
    fetch('/api/v1/mint_credits')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                creditsDisplay.textContent = `Mint Credits: ${data.credits}`;
            } else {
                creditsDisplay.textContent = 'Error fetching mint credits';
            }
        })
        .catch(error => {
            console.error('Error fetching mint credits:', error);
            creditsDisplay.textContent = 'Error fetching mint credits';
        });

    // Inscription Name Input
    const inscriptionNameInput = document.createElement('input');
    inscriptionNameInput.type = 'text';
    inscriptionNameInput.placeholder = 'Inscription name';
    inscriptionNameInput.className = 'inscription-name-input'; // Use a class for styling
    landingPage.appendChild(inscriptionNameInput);

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    landingPage.appendChild(buttonContainer);

    // Inscribe button
    const inscribeButton = document.createElement('button');
    inscribeButton.textContent = 'Inscribe';
    inscribeButton.className = 'styled-button'; // Use a class for styling
    inscribeButton.addEventListener('click', () => inscribeTransaction());
    buttonContainer.appendChild(inscribeButton);

    // Inscribe All button
    const inscribeAllButton = document.createElement('button');
    inscribeAllButton.textContent = 'Inscribe All';
    inscribeAllButton.className = 'styled-button'; // Use a class for styling
    inscribeAllButton.addEventListener('click', () => inscribeAllTransactions());
    buttonContainer.appendChild(inscribeAllButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        mintFileUI(); // Navigate back to mint file UI
    });
    buttonContainer.appendChild(backButton);

    // Container for the transaction list
    const txListContainer = document.createElement('div');
    txListContainer.className = 'tx-list-container';
    landingPage.appendChild(txListContainer);

    // Retrieve and display pending transactions
    const txList = document.createElement('ul');
    txList.className = 'transaction-list'; // Add a class for styling
    const mintResponse = JSON.parse(localStorage.getItem('mintResponse')) || {};
    const pendingTransactions = mintResponse.pendingTransactions || [];
    updateTransactionList(pendingTransactions);
    txListContainer.appendChild(txList);

    // Function to update the transaction list
    function updateTransactionList(transactions) {
        txList.innerHTML = ''; // Clear existing list
        transactions.forEach(tx => {
            const listItem = document.createElement('li');
            listItem.textContent = `Transaction Number: ${tx.transactionNumber}, TXID: ${tx.txid}`;
            txList.appendChild(listItem);
        });
    }

    // Function to inscribe a single transaction
    function inscribeTransaction(showAlert = true) {
        const mintCreditsText = creditsDisplay.textContent;
        const mintCredits = mintCreditsText ? parseInt(mintCreditsText.split(': ')[1], 10) : 0;
        if (mintCredits <= 0) {
            alert('Insufficient mint credits.');
            return Promise.reject('Insufficient mint credits.');
        }

        const mintResponse = JSON.parse(localStorage.getItem('mintResponse')) || {};
        const pendingTransactions = mintResponse.pendingTransactions || [];
        if (pendingTransactions.length === 0) {
            alert('No pending transactions available.');
            return Promise.reject('No pending transactions available.');
        }

        // Disable buttons and change text
        inscribeButton.disabled = true;
        inscribeAllButton.disabled = true;
        backButton.disabled = true;
        inscribeButton.textContent = 'Processing...';
        inscribeAllButton.textContent = 'Processing...';

        const topTransaction = pendingTransactions[0];
        const txHex = topTransaction.hex;
        const ticker = topTransaction.ticker; // Use the ticker from the transaction

        return fetch(`/api/v1/send_raw_tx/${ticker}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey // Ensure the API key is included here
            },
            body: JSON.stringify({ tx_hex: txHex })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const inscriptionName = inscriptionNameInput.value.trim();
                const myInscriptions = JSON.parse(localStorage.getItem('MyInscriptions')) || {};

                // Only add to My Inscriptions if the transaction number is 2
                if (topTransaction.transactionNumber === 2) {
                    myInscriptions.push({
                        name: inscriptionName,
                        txid: data.data.txid
                    });
                    localStorage.setItem('MyInscriptions', JSON.stringify(myInscriptions));
                }

                // Remove the transaction from the pending list
                pendingTransactions.shift();
                localStorage.setItem('mintResponse', JSON.stringify({ pendingTransactions }));

                // Remove the used UTXO from the wallet's UTXOs
                removeUsedUTXO(topTransaction);

                // Clear pending UTXOs
                clearPendingUTXOs();

                // Update the displayed transaction list
                updateTransactionList(pendingTransactions);

                if (showAlert) {
                    alert(`Transaction sent successfully! TXID: ${data.data.txid}`);
                }
            } else {
                alert(`Error sending transaction: ${data.message}`);
                return Promise.reject(`Error sending transaction: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error sending transaction:', error);
            if (showAlert) {
                alert('An error occurred while sending the transaction.');
            }
            return Promise.reject(error);
        })
        .finally(() => {
            // Re-enable buttons and reset text
            inscribeButton.disabled = false;
            inscribeAllButton.disabled = false;
            backButton.disabled = false;
            inscribeButton.textContent = 'Inscribe';
            inscribeAllButton.textContent = 'Inscribe All';
        });
    }

    /**
     * Function to remove the used UTXO from the wallet's UTXOs
     * @param {Object} transaction - The transaction object containing UTXO details
     */
    function removeUsedUTXO(transaction) {
        try {
            const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
            const walletIndex = wallets.findIndex(wallet => wallet.label === transaction.walletLabel);
            if (walletIndex === -1) {
                console.warn('Wallet not found for the transaction.');
                return;
            }

            const wallet = wallets[walletIndex];
            const utxoIndex = wallet.utxos.findIndex(utxo => utxo.txid === transaction.txid && utxo.vout === transaction.vout);
            if (utxoIndex === -1) {
                console.warn('UTXO not found in the wallet.');
                return;
            }

            // Remove the UTXO from the wallet's UTXOs
            wallet.utxos.splice(utxoIndex, 1);
            console.log(`Removed UTXO ${transaction.txid}:${transaction.vout} from wallet ${wallet.label}.`);

            // Update the wallets in local storage
            localStorage.setItem('wallets', JSON.stringify(wallets));
        } catch (error) {
            console.error('Error removing used UTXO from wallet:', error);
            alert('An error occurred while updating the wallet UTXOs.');
        }
    }

    /**
     * Function to clear pending UTXOs from local storage
     */
    function clearPendingUTXOs() {
        try {
            localStorage.removeItem('pendingUTXOs');
            console.log('Pending UTXOs cleared from local storage.');
        } catch (error) {
            console.error('Error clearing pending UTXOs from local storage:', error);
            alert('An error occurred while clearing pending UTXOs.');
        }
    }

    // Function to inscribe all transactions
    function inscribeAllTransactions() {
        const mintResponse = JSON.parse(localStorage.getItem('mintResponse')) || {};
        const pendingTransactions = mintResponse.pendingTransactions || [];

        function processNextTransaction() {
            if (pendingTransactions.length === 0) {
                alert('All transactions processed.');
                return;
            }

            inscribeTransaction(false)
                .then(() => {
                    setTimeout(() => {
                        processNextTransaction();
                    }, 1000); // Wait 1 second before processing the next transaction
                })
                .catch(error => {
                    console.error('Error processing transactions:', error);
                });
        }

        processNextTransaction();
    }
}
