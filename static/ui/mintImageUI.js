import { mintSelectionUI } from './mintSelectionUI.js'; // Import the mintSelectionUI function
import { inscribeUI } from './inscribeUI.js'; // Import the inscribeUI function

// Helper function to read from localStorage with logging
function readFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    try {
        const parsedData = JSON.parse(data);
        console.log(`Read from localStorage [${key}]:`, parsedData);
        return parsedData;
    } catch (error) {
        console.error(`Error parsing JSON from localStorage [${key}]:`, error);
        return null; // Return null if parsing fails
    }
}

// Helper function to write to localStorage with logging
function writeToLocalStorage(key, value) {
    console.log(`Write to localStorage [${key}]:`, value);
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Function to initialize and render the Mint Image UI.
 */
export function mintImageUI(selectedWalletLabel = readFromLocalStorage('selectedWalletLabel') || null) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Create and append the page title
    const title = document.createElement('h1');
    title.textContent = 'Mint Image';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Display mint credits
    const creditsDisplay = document.createElement('div');
    creditsDisplay.className = 'credits-display'; // Use a class for styling
    landingPage.appendChild(creditsDisplay);

    // Fetch and display mint credits
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

    // Wallet dropdown
    const walletDropdown = document.createElement('select');
    walletDropdown.className = 'styled-select'; // Use a class for styling
    const wallets = readFromLocalStorage('wallets') || [];

    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select a Wallet';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    walletDropdown.appendChild(defaultOption);

    wallets.forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.label;
        option.textContent = wallet.label;
        if (wallet.label === selectedWalletLabel) {
            option.selected = true; // Select the stored wallet
        }
        walletDropdown.appendChild(option);
    });
    landingPage.appendChild(walletDropdown);

    // UTXO dropdown
    const utxoDropdown = document.createElement('select');
    utxoDropdown.className = 'styled-select'; // Use a class for styling
    landingPage.appendChild(utxoDropdown);

    // Update UTXO dropdown based on selected wallet
    walletDropdown.addEventListener('change', () => {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        if (selectedWallet && selectedWallet.utxos && selectedWallet.utxos.length > 0) {
            utxoDropdown.innerHTML = ''; // Clear existing options
            selectedWallet.utxos
                .filter(utxo => parseFloat(utxo.value) > 0.01) // Filter out UTXOs with value of 0.01 or less
                .forEach(utxo => {
                    const option = document.createElement('option');
                    option.value = `${utxo.txid}:${utxo.vout}`; // Combine txid and vout for uniqueness
                    option.textContent = utxo.value; // Display only the UTXO amount
                    utxoDropdown.appendChild(option);
                });
            if (selectedWallet.utxos.filter(utxo => parseFloat(utxo.value) > 0.01).length === 0) {
                utxoDropdown.innerHTML = '<option disabled>No UTXOs available above 0.01</option>';
            }
        } else {
            utxoDropdown.innerHTML = '<option disabled>No UTXOs available</option>'; // Handle case where no UTXOs are available
        }

        // Save the selected wallet label to local storage
        if (selectedWallet) {
            writeToLocalStorage('selectedWalletLabel', selectedWallet.label);
        } else {
            localStorage.removeItem('selectedWalletLabel');
        }
    });

    // **Added Code: Trigger UTXO loading on page load if a wallet is selected**
    if (selectedWalletLabel) {
        walletDropdown.value = selectedWalletLabel;
        walletDropdown.dispatchEvent(new Event('change')); // Trigger the change event to load UTXOs
    }

    // Log selected UTXO information
    utxoDropdown.addEventListener('change', () => {
        if (utxoDropdown.value) {
            const [txid, vout] = utxoDropdown.value.split(':');
            const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
            const selectedUtxo = selectedWallet.utxos.find(utxo => utxo.txid === txid && utxo.vout == vout);
            if (selectedUtxo) {
                console.log('Selected UTXO:', selectedUtxo); // Log the selected UTXO information
            }
        }
    });

    // Receiving address input
    const addressInput = document.createElement('input');
    addressInput.type = 'text';
    addressInput.placeholder = 'Enter receiving address (optional)';
    addressInput.className = 'styled-input'; // Use a class for styling
    landingPage.appendChild(addressInput);

    // Generate Transactions button
    const generateTxButton = document.createElement('button');
    generateTxButton.textContent = 'Inscribe';
    generateTxButton.className = 'styled-button'; // Use a class for styling
    generateTxButton.addEventListener('click', generateTransactions);
    landingPage.appendChild(generateTxButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button back-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        mintSelectionUI(); // Navigate back to mint selection UI
    });
    landingPage.appendChild(backButton);

    /**
     * Function to generate transactions
     */
    function generateTransactions() {
        // Check for pending transactions
        const pendingTransactions = readFromLocalStorage('mintResponse')?.pendingTransactions || [];
        if (pendingTransactions.length > 0) {
            alert('There are pending transactions. Continuing to inscribe UI.');
            inscribeUI(); // Navigate to inscribe UI
            return; // Exit the function early
        }

        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        if (!selectedWallet) {
            alert('Please select a wallet.');
            return;
        }

        if (!utxoDropdown.value) {
            alert('Please select a UTXO.');
            return;
        }

        const [txid, vout] = utxoDropdown.value.split(':');
        const selectedUtxo = selectedWallet.utxos.find(utxo => utxo.txid === txid && utxo.vout == vout);

        console.log('Selected UTXO for Transaction:', selectedUtxo); // Log selected UTXO

        // **Use pending hex data from local storage**
        const pendingHexData = readFromLocalStorage('pendingHexData'); // Use helper function
        if (!pendingHexData) {
            alert('No pending hex data found. Please ensure the data is available.');
            return;
        }

        const receivingAddressInput = addressInput.value.trim();
        const receivingAddress = receivingAddressInput || selectedWallet.address;

        const requestBody = {
            receiving_address: receivingAddress,
            meme_type: pendingHexData.mimeType,
            hex_data: pendingHexData.hexData,
            sending_address: selectedWallet.address,
            privkey: selectedWallet.privkey, // **WARNING:** Ensure this is securely handled
            utxo: selectedUtxo.txid, // Correctly set to the TXID
            vout: selectedUtxo.vout,
            script_hex: selectedUtxo.script_hex,
            utxo_amount: selectedUtxo.value
        };

        console.log('Request Body:', requestBody); // Log the request body

        fetch(`/api/v1/mint/${selectedWallet.ticker}`, { // Use the correct endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey // Assume apiKey is globally accessible
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            console.log('Full Response:', response); // Log the full response object
            return response.json();
        })
        .then(data => {
            console.log('Response Data:', JSON.stringify(data, null, 2)); // Log the response data in a readable format

            // **Adjusting the Success Condition**
            if (data.pendingTransactions && Array.isArray(data.pendingTransactions) && data.pendingTransactions.length > 0) {
                console.log('Pending Transactions:', data.pendingTransactions); // Log pending transactions

                // **Save Transaction Hexes to a List**
                try {
                    // Retrieve existing hexes from local storage, or initialize an empty array
                    let existingHexes = readFromLocalStorage('transactionHexes') || [];

                    // Extract hex data from pendingTransactions
                    const newHexes = data.pendingTransactions.map(tx => tx.hex);

                    // Append new hexes to the existing list
                    existingHexes.push(...newHexes);

                    // Save the updated list back to local storage
                    writeToLocalStorage('transactionHexes', existingHexes);
                    console.log('Transaction hexes saved successfully:', newHexes);
                } catch (error) {
                    console.error('Error saving transaction hexes to local storage:', error);
                    alert('An error occurred while saving the transaction hexes.');
                }

                // **Optional:** Save the entire response to local storage
                try {
                    const pendingTransactions = data.pendingTransactions.map(tx => ({
                        ...tx,
                        ticker: selectedWallet.ticker // Add the ticker to each transaction
                    }));

                    writeToLocalStorage('mintResponse', { pendingTransactions });
                    console.log('Mint response saved successfully.');
                    
                    // Navigate to inscribe UI instead of alert
                    inscribeUI();
                } catch (error) {
                    console.error('Error saving mintResponse to local storage:', error);
                    alert('An error occurred while saving the mint response.');
                }

                // **New Code: Save Used UTXO as Pending UTXO**
                try {
                    // Retrieve existing pending UTXOs from local storage, or initialize an empty array
                    let pendingUTXOs = readFromLocalStorage('pendingUTXOs') || [];

                    // Define the used UTXO
                    const usedUtxo = {
                        txid: selectedUtxo.txid,
                        vout: selectedUtxo.vout
                    };

                    // Avoid duplicates
                    const isAlreadyPending = pendingUTXOs.some(utxo => utxo.txid === usedUtxo.txid && utxo.vout === usedUtxo.vout);
                    if (!isAlreadyPending) {
                        pendingUTXOs.push(usedUtxo);
                        writeToLocalStorage('pendingUTXOs', pendingUTXOs);
                        console.log('Pending UTXO saved:', usedUtxo);
                    } else {
                        console.log('UTXO is already marked as pending:', usedUtxo);
                    }
                } catch (error) {
                    console.error('Error saving pending UTXOs to local storage:', error);
                    alert('An error occurred while saving the pending UTXO.');
                }

                localStorage.removeItem('pendingHexData'); // Remove pending hex data from local storage
            } else {
                // Handle cases where pendingTransactions is missing or empty
                console.error('Mint API did not return pendingTransactions or it is empty:', data);
                alert(data.message || 'An error occurred.');
            }
        })
        .catch(error => {
            console.error('Error generating transaction:', error); // Log the full error
            alert('An error occurred while generating the transaction.');
        });
    }

    // **New Code: Invoke syncAllWallets on page load**
    syncAllWallets(selectedWalletLabel);

    // **New Code: Set up periodic syncing every 2 minutes**
    setInterval(() => syncAllWallets(selectedWalletLabel), 120000); // 120,000 milliseconds = 2 minutes
}

/**
 * Function to sync all wallets
 */
async function syncAllWallets(selectedWalletLabel) {
    const wallets = readFromLocalStorage('wallets') || [];
    const apiUrl = 'https://blockchainplugz.com/api/v1';

    for (const wallet of wallets) {
        const { ticker, address } = wallet;

        try {
            const response = await fetch(`${apiUrl}/get_tx_unspent/${ticker}/${address}`, {
                headers: {
                    'X-API-Key': apiKey // Ensure apiKey is defined and accessible
                }
            });

            const data = await response.json();
            console.log(`UTXO Response for ${wallet.label}:`, data); // Log the UTXO response

            if (data.status === 'success') {
                wallet.utxos = data.data.txs.map(tx => ({
                    txid: tx.txid,
                    value: tx.value,
                    confirmations: tx.confirmations,
                    vout: tx.vout,
                    script_hex: tx.script_hex
                }));
                console.log(`UTXOs updated for ${wallet.label}:`, wallet.utxos); // Log the updated UTXOs

                // Calculate the balance by summing up the values of UTXOs greater than 0.01
                wallet.balance = wallet.utxos
                    .filter(utxo => parseFloat(utxo.value) > 0.01)
                    .reduce((acc, utxo) => acc + parseFloat(utxo.value), 0);
            } else {
                alert(`Error syncing wallet "${wallet.label}": ${data.message}`);
            }
        } catch (error) {
            console.error(`Error fetching UTXOs for wallet "${wallet.label}":`, error);
            alert(`An error occurred while fetching UTXOs for wallet "${wallet.label}".`);
        }
    }

    // Save updated wallets back to local storage
    writeToLocalStorage('wallets', wallets);

    // Update UI if the selected wallet was synced
    if (selectedWalletLabel) {
        const selectedWallet = wallets.find(wallet => wallet.label === selectedWalletLabel);
        if (selectedWallet) {
            // Update balance display or other UI elements if needed
            console.log(`Balance updated for ${selectedWallet.label}: ${selectedWallet.balance || 'N/A'}`);
        }
    }
}