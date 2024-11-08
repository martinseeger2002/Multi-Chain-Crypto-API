// inscribeFolder.js
import { mintFolderUI } from './mintFolderUI.js'; // Import the mintFolderUI function

/**
 * Function to initialize and render the Inscribe Folder UI.
 */
export function inscribeFolderUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Create and append the page title
    const title = document.createElement('h1');
    title.textContent = 'Inscribe Folder';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Mint Credits Display
    const creditsDisplay = document.createElement('p');
    creditsDisplay.className = 'credits-display'; // Use a class for styling
    landingPage.appendChild(creditsDisplay);

    // Timer Display
    const timerDisplay = document.createElement('p');
    timerDisplay.className = 'timer-display'; // Use a class for styling
    landingPage.appendChild(timerDisplay);

    // JSON Display Iframe
    const jsonIframe = document.createElement('iframe');
    jsonIframe.style.width = '100%';
    jsonIframe.style.height = '300px';
    jsonIframe.style.border = '1px solid #000';
    landingPage.appendChild(jsonIframe);

    // Start/Continue Button
    const startContinueButton = document.createElement('button');
    startContinueButton.textContent = 'Start/Continue';
    startContinueButton.className = 'styled-button'; // Use a class for styling
    startContinueButton.addEventListener('click', () => {
        processEntries();
    });
    landingPage.appendChild(startContinueButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        mintFolderUI(); // Navigate back to Mint Folder UI
    });
    landingPage.appendChild(backButton);

    // Fetch and update mint credits
    let mintCredits = 0;
    fetch('/api/v1/mint_credits')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                mintCredits = data.credits;
                creditsDisplay.textContent = `Mint Credits: ${mintCredits}`;
            } else {
                creditsDisplay.textContent = 'Mint credits error. Log out and log back in.';
                startContinueButton.disabled = true; // Disable the button if there's an error
            }
        })
        .catch(error => {
            console.error('Error fetching mint credits:', error);
            creditsDisplay.textContent = 'Mint credits error. Log out and log back in.';
            startContinueButton.disabled = true; // Disable the button if there's an error
        });

    // Function to process JSON entries
    async function processEntries() {
        const folderFileData = JSON.parse(localStorage.getItem('folderFileData')) || [];
        const selectedWalletLabel = localStorage.getItem('selectedWalletLabel');
        const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
        const selectedWallet = wallets.find(wallet => wallet.label === selectedWalletLabel);

        if (!selectedWallet) {
            alert('Please select a wallet in the Mint Folder UI.');
            return;
        }

        for (let entry of folderFileData) {
            if (!entry.inscription_id) {
                // Update the iframe with the current entry
                updateIframe(entry);

                if (entry.txid) {
                    // Process pending transactions if txid exists
                    await processPendingTransactions(entry, selectedWallet);
                } else {
                    // Create and send transactions if no txid
                    await createAndSendTransactions(entry, selectedWallet);
                }

                // Save the updated folderFileData to localStorage
                localStorage.setItem('folderFileData', JSON.stringify(folderFileData));

                // Wait for a short period before processing the next entry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        alert('All entries have been processed.');
    }

    // Function to update the iframe with the current JSON entry
    function updateIframe(entry) {
        const doc = jsonIframe.contentDocument || jsonIframe.contentWindow.document;
        doc.open();
        doc.write('<html><body><pre>' + JSON.stringify(entry, null, 2) + '</pre></body></html>');
        doc.close();
    }

    // Function to process pending transactions
    async function processPendingTransactions(entry, selectedWallet) {
        let pendingTransactions = entry.pending_transactions || [];

        while (pendingTransactions.length > 0) {
            if (mintCredits < 1) {
                alert('Insufficient mint credits.');
                return;
            }

            const currentTransaction = pendingTransactions[0];
            const txHex = currentTransaction.hex;
            let attempts = 0;
            let success = false;

            while (attempts < 3 && !success) {
                try {
                    const response = await fetch(`/api/v1/send_raw_tx/${selectedWallet.ticker}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-Key': apiKey
                        },
                        body: JSON.stringify({ tx_hex: txHex })
                    });

                    if (response.status === 500) {
                        attempts++;
                        await new Promise(resolve => setTimeout(resolve, 10)); // Wait 0.01 seconds
                        continue;
                    }

                    const data = await response.json();

                    if (data.status === 'success') {
                        success = true;
                        // Remove the sent transaction from the pending list
                        pendingTransactions.shift();

                        // Update the txid if it's the second transaction
                        if (currentTransaction.number === 2) {
                            entry.txid = data.data.txid;
                        }

                        // Add last_txid to the entry
                        entry.last_txid = data.data.txid;

                        // Update mint credits
                        mintCredits -= 1;
                        creditsDisplay.textContent = `Mint Credits: ${mintCredits}`;

                        // Call the API to remove a mint credit
                        await fetch('/api/v1/remove_mint_credit', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        // Update the entry and iframe
                        entry.pending_transactions = pendingTransactions;
                        updateIframe(entry);

                        // If all transactions are sent, append i0 to txid and set inscription_id
                        if (pendingTransactions.length === 0) {
                            entry.inscription_id = `${entry.txid}i0`;
                            updateIframe(entry);

                            // Sync wallet to update UTXOs
                            await syncWallet(selectedWallet);
                        }
                    } else {
                        // Handle error 26: mempool too long
                        if (data.message && data.message.includes('error code 26')) {
                            console.log('Mempool too long error. Waiting for confirmation.');
                            await waitForConfirmation(entry.txid, selectedWallet.ticker);
                        } else {
                            alert(`Error sending transaction: ${data.message}`);
                            throw new Error(data.message);
                        }
                    }
                } catch (error) {
                    console.error('Error sending transaction:', error);
                    throw error;
                }
            }

            if (!success) {
                alert('Failed to send transaction after 3 attempts.');
                return;
            }
        }
    }

    // Function to sync wallet and update UTXOs
    async function syncWallet(selectedWallet) {
        const apiUrl = 'https://blockchainplugz.com/api/v1'; // Ensure the correct base URL is used

        try {
            // Import the wallet address
            await fetch(`${apiUrl}/import_address/${selectedWallet.ticker}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey // Ensure apiKey is defined and accessible
                },
                body: JSON.stringify({ address: selectedWallet.address })
            });

            // Fetch UTXOs
            const response = await fetch(`${apiUrl}/get_tx_unspent/${selectedWallet.ticker}/${selectedWallet.address}`, {
                headers: {
                    'X-API-Key': apiKey // Ensure apiKey is defined and accessible
                }
            });

            const data = await response.json();
            console.log(`UTXO Response for ${selectedWallet.label}:`, data); // Log the UTXO response

            if (data.status === 'success') {
                selectedWallet.utxos = data.data.txs.map(tx => ({
                    txid: tx.txid,
                    value: tx.value,
                    confirmations: tx.confirmations,
                    vout: tx.vout,
                    script_hex: tx.script_hex
                }));
                console.log(`UTXOs updated for ${selectedWallet.label}:`, selectedWallet.utxos); // Log the updated UTXOs

                // Update the wallet's UTXOs in local storage
                const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
                const walletIndex = wallets.findIndex(wallet => wallet.label === selectedWallet.label);
                if (walletIndex !== -1) {
                    wallets[walletIndex].utxos = selectedWallet.utxos;
                    localStorage.setItem('wallets', JSON.stringify(wallets));
                    console.log('Wallet UTXOs updated successfully.');
                }
            } else {
                console.error(`Error syncing wallet "${selectedWallet.label}": ${data.message}`);
            }
        } catch (error) {
            console.error(`Error fetching UTXOs for wallet "${selectedWallet.label}":`, error);
        }
    }

    // Function to wait for transaction confirmation
    async function waitForConfirmation(txid, ticker) {
        let confirmed = false;
        while (!confirmed) {
            try {
                const response = await fetch(`/api/v1/get_tx/${ticker}/${txid}`, {
                    headers: {
                        'X-API-Key': apiKey
                    }
                });
                const data = await response.json();

                if (data.status === 'success' && data.data.confirmations > 0) {
                    confirmed = true;
                    console.log(`Transaction ${txid} confirmed.`);
                } else {
                    console.log(`Transaction ${txid} not yet confirmed. Retrying in 30 seconds.`);
                    await new Promise(resolve => setTimeout(resolve, 30000));
                }
            } catch (error) {
                console.error('Error checking transaction confirmation:', error);
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
    }

    // Function to create and send transactions
    async function createAndSendTransactions(entry, selectedWallet) {
        // Check if there are pending transactions
        if (entry.pending_transactions && entry.pending_transactions.length > 0) {
            // If there are pending transactions, process them
            await processPendingTransactions(entry, selectedWallet);
            return; // Exit the function after processing pending transactions
        }

        let utxoFound = false;

        while (!utxoFound) {
            // Sync wallet to refresh UTXOs
            await syncWallet(selectedWallet);

            // Find a new UTXO for each entry
            const utxoIndex = selectedWallet.utxos.findIndex(utxo => parseFloat(utxo.value) > 5 && utxo.confirmations >= 1);
            if (utxoIndex === -1) {
                // Display retry timer
                let retryTime = 120; // 2 minutes in seconds
                const timerInterval = setInterval(() => {
                    if (retryTime <= 0) {
                        clearInterval(timerInterval);
                        timerDisplay.textContent = '';
                    } else {
                        timerDisplay.textContent = `Retrying in: ${retryTime} seconds`;
                        retryTime--;
                    }
                }, 1000);

                await new Promise(resolve => setTimeout(resolve, 120000)); // Wait for 2 minutes
                continue; // Retry the loop
            }

            // Select and remove the UTXO from the list
            const utxo = selectedWallet.utxos.splice(utxoIndex, 1)[0];
            utxoFound = true; // Exit the loop

            // Convert file data to base64 and then to hex
            const fileData = await getFileData(entry.file_path);
            const base64Data = btoa(fileData);
            const hexData = base64ToHex(base64Data);
            entry.hex_data = hexData;
            updateIframe(entry);

            // Prepare the request body for minting
            const requestBody = {
                receiving_address: selectedWallet.address,
                meme_type: entry.mime_type,
                hex_data: hexData,
                sending_address: selectedWallet.address,
                privkey: selectedWallet.privkey,
                utxo: utxo.txid,
                vout: utxo.vout,
                script_hex: utxo.script_hex,
                utxo_amount: utxo.value
            };

            let attempts = 0;
            let success = false;

            while (attempts < 3 && !success) {
                try {
                    const response = await fetch(`/api/v1/mint/${selectedWallet.ticker}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-Key': apiKey
                        },
                        body: JSON.stringify(requestBody)
                    });

                    if (response.status === 500) {
                        attempts++;
                        await new Promise(resolve => setTimeout(resolve, 10)); // Wait 0.01 seconds
                        continue;
                    }

                    const data = await response.json();

                    if (data.pendingTransactions && Array.isArray(data.pendingTransactions) && data.pendingTransactions.length > 0) {
                        success = true;
                        // Number the pending transactions and remove hex_data
                        entry.pending_transactions = data.pendingTransactions.map((tx, index) => ({
                            hex: tx.hex,
                            number: index + 1
                        }));
                        delete entry.hex_data;
                        updateIframe(entry);

                        // Start sending pending transactions
                        await processPendingTransactions(entry, selectedWallet);
                    } else {
                        alert('Error minting file: ' + (data.message || 'Unknown error.'));
                        throw new Error(data.message || 'Unknown error.');
                    }
                } catch (error) {
                    console.error('Error minting file:', error);
                    throw error;
                }
            }

            if (!success) {
                alert('Failed to mint file after 3 attempts.');
                return;
            }
        }
    }

    // Utility function to read file data
    function getFileData(filePath) {
        return new Promise((resolve, reject) => {
            let folderInput = document.getElementById('folder-input');

            // If folderInput is not found, create it
            if (!folderInput) {
                folderInput = document.createElement('input');
                folderInput.type = 'file';
                folderInput.webkitdirectory = true; // Allow directory selection
                folderInput.style.display = 'none'; // Hide the default file input
                folderInput.id = 'folder-input'; // Assign an ID
                document.body.appendChild(folderInput); // Append to the body

                // Add an event listener to handle folder selection
                folderInput.addEventListener('change', () => {
                    // Retry getting the file data after folder selection
                    getFileData(filePath).then(resolve).catch(reject);
                });
            }

            const files = Array.from(folderInput.files);

            if (files.length === 0) {
                alert('Please reselect the folder.');
                folderInput.click(); // Trigger the folder selection
                reject('Folder not selected.');
                return;
            }

            const file = files.find(f => f.webkitRelativePath === filePath);

            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    resolve(e.target.result);
                };
                reader.onerror = function(e) {
                    reject(e);
                };
                reader.readAsBinaryString(file);
            } else {
                reject('File not found: ' + filePath);
            }
        });
    }

    // Utility function to convert base64 to hex
    function base64ToHex(base64) {
        const raw = atob(base64);
        let result = '';
        for (let i = 0; i < raw.length; i++) {
            const hex = raw.charCodeAt(i).toString(16);
            result += (hex.length === 2 ? hex : '0' + hex);
        }
        return result.toUpperCase();
    }
}
