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

    // Pending Transactions Counter
    const pendingTxDisplay = document.createElement('p');
    pendingTxDisplay.className = 'pending-tx-display'; // Use a class for styling
    landingPage.appendChild(pendingTxDisplay);

    // Fetch and update mint credits and pending transactions
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

    // Initialize Pending Transactions Counter
    const mintResponse = JSON.parse(localStorage.getItem('mintResponse')) || {};
    let pendingTransactions = mintResponse.pendingTransactions || [];
    updatePendingTxCounter(pendingTransactions.length);
    pendingTxDisplay.textContent = `Pending Transactions: ${pendingTransactions.length}`;

    // Inscription Name Input
    const inscriptionNameInput = document.createElement('input');
    inscriptionNameInput.type = 'text';
    inscriptionNameInput.placeholder = 'Inscription name';
    inscriptionNameInput.className = 'inscription-name-input'; // Use a class for styling
    landingPage.appendChild(inscriptionNameInput);

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container'; // Ensure this class stacks buttons vertically via CSS
    landingPage.appendChild(buttonContainer);

    // Inscribe button
    const inscribeButton = document.createElement('button');
    inscribeButton.textContent = 'Inscribe';
    inscribeButton.className = 'splash-enter-button'; // Updated to match mainSplashUI styling
    inscribeButton.addEventListener('click', () => inscribeTransaction());
    buttonContainer.appendChild(inscribeButton);

    // Inscribe All button
    const inscribeAllButton = document.createElement('button');
    inscribeAllButton.textContent = 'Inscribe All';
    inscribeAllButton.className = 'splash-enter-button'; // Updated to match mainSplashUI styling
    inscribeAllButton.addEventListener('click', () => inscribeAllTransactions());
    buttonContainer.appendChild(inscribeAllButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'splash-enter-button'; // Updated to match mainSplashUI styling
    backButton.addEventListener('click', () => {
        mintFileUI(); // Navigate back to mint file UI
    });
    buttonContainer.appendChild(backButton);

    // Function to update the pending transactions counter
    function updatePendingTxCounter(count) {
        pendingTxDisplay.textContent = `Pending Transactions: ${count}`;
    }

    // Function to inscribe a single transaction
    function inscribeTransaction(showAlert = true) {
        const mintCredits = parseInt(creditsDisplay.textContent.split(': ')[1], 10);
        if (mintCredits <= 0) {
            alert('Insufficient mint credits.');
            return Promise.reject('Insufficient mint credits.');
        }

        const mintResponse = JSON.parse(localStorage.getItem('mintResponse')) || {};
        pendingTransactions = mintResponse.pendingTransactions || [];
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
                const myInscriptions = JSON.parse(localStorage.getItem('MyInscriptions')) || [];

                // Only add to My Inscriptions if the transaction number is 2
                if (topTransaction.transactionNumber === 2) {
                    myInscriptions.push({
                        name: inscriptionName,
                        txid: data.data.txid
                    });
                    localStorage.setItem('MyInscriptions', JSON.stringify(myInscriptions));
                }

                // Remove the transaction from the pending list
                const completedTransaction = pendingTransactions.shift();
                localStorage.setItem('mintResponse', JSON.stringify({ pendingTransactions }));

                // Retrieve and remove the pending UTXO from local storage
                const pendingUtxo = JSON.parse(localStorage.getItem('pendingUtxo'));
                if (pendingUtxo) {
                    localStorage.removeItem('pendingUtxo');
                }

                // Remove the UTXO from the wallet's UTXO list
                const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
                const selectedWallet = wallets.find(wallet => wallet.label === selectedWalletLabel);
                if (selectedWallet) {
                    selectedWallet.utxos = selectedWallet.utxos.filter(utxo => utxo.txid !== pendingUtxo.txid);
                    localStorage.setItem('wallets', JSON.stringify(wallets));
                }

                // Update the pending transactions counter
                updatePendingTxCounter(pendingTransactions.length);

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

    // Function to inscribe all transactions
    function inscribeAllTransactions() {
        mintResponse.pendingTransactions = pendingTransactions;
        localStorage.setItem('mintResponse', JSON.stringify(mintResponse));

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
