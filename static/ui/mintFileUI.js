import { mintSelectionUI } from './mintSelectionUI.js'; // Import the mintSelectionUI function
import { inscribeUI } from './inscribeUI.js'; // Import the inscribeUI function

export function mintFileUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Mint File';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Display mint credits
    const creditsDisplay = document.createElement('div');
    creditsDisplay.className = 'credits-display'; // Use a class for styling
    landingPage.appendChild(creditsDisplay);

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
    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
    wallets.forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.label;
        option.textContent = wallet.label;
        walletDropdown.appendChild(option);
    });
    landingPage.appendChild(walletDropdown);

    // Sync Wallet button
    const syncButton = document.createElement('button');
    syncButton.textContent = 'Sync Wallet';
    syncButton.className = 'styled-button'; // Use a class for styling
    syncButton.addEventListener('click', syncWallet);
    landingPage.appendChild(syncButton);

    // UTXO dropdown
    const utxoDropdown = document.createElement('select');
    utxoDropdown.className = 'styled-select'; // Use a class for styling
    landingPage.appendChild(utxoDropdown);

    walletDropdown.addEventListener('change', () => {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        if (selectedWallet && selectedWallet.utxos) {
            utxoDropdown.innerHTML = ''; // Clear existing options
            selectedWallet.utxos.forEach(utxo => {
                const option = document.createElement('option');
                option.value = `${utxo.txid}:${utxo.vout}`; // Combine txid and vout for uniqueness
                option.textContent = `TXID: ${utxo.txid}, vout: ${utxo.vout}, Value: ${utxo.value}`;
                utxoDropdown.appendChild(option);
            });
        } else {
            utxoDropdown.innerHTML = '<option disabled>No UTXOs available</option>'; // Handle case where no UTXOs are available
        }
    });

    utxoDropdown.addEventListener('change', () => {
        const [txid, vout] = utxoDropdown.value.split(':');
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        const selectedUtxo = selectedWallet.utxos.find(utxo => utxo.txid === txid && utxo.vout == vout);
        if (selectedUtxo) {
            console.log('Selected UTXO:', selectedUtxo); // Log the selected UTXO information
        }
    });

    // Receiving address input
    const addressInput = document.createElement('input');
    addressInput.type = 'text';
    addressInput.placeholder = 'Enter receiving address';
    addressInput.className = 'styled-input'; // Use a class for styling
    landingPage.appendChild(addressInput);

    // File selection container
    const fileContainer = document.createElement('div');
    fileContainer.className = 'file-container'; // Use a class for styling

    // File selection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'file-input';
    fileInput.style.display = 'none'; // Hide the default file input

    const fileLabel = document.createElement('div');
    fileLabel.className = 'file-label'; // Use a class for styling

    const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgIcon.setAttribute('width', '24');
    svgIcon.setAttribute('height', '24');
    svgIcon.setAttribute('fill', '#00bfff');
    svgIcon.setAttribute('viewBox', '0 0 24 24');
    svgIcon.innerHTML = `
        <path d="M12 2L12 14M12 14L8 10M12 14L16 10M4 18H20" stroke="#00bfff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `;

    const fileText = document.createElement('span');
    fileText.textContent = 'Choose File';
    fileText.className = 'file-text'; // Use a class for styling

    // Append SVG and text to the label
    fileLabel.appendChild(svgIcon);
    fileLabel.appendChild(fileText);

    // Make the entire container clickable
    fileContainer.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);

    // Append file input and label to the container
    fileContainer.appendChild(fileInput);
    fileContainer.appendChild(fileLabel);

    // Append the container to the landing page
    landingPage.appendChild(fileContainer);

    // Generate Transactions button
    const generateTxButton = document.createElement('button');
    generateTxButton.textContent = 'Generate Transactions';
    generateTxButton.className = 'styled-button'; // Use a class for styling
    generateTxButton.addEventListener('click', generateTransactions);
    landingPage.appendChild(generateTxButton);

    // Inscribe button
    const inscribeButton = document.createElement('button');
    inscribeButton.textContent = 'Inscribe';
    inscribeButton.className = 'styled-button'; // Use a class for styling
    inscribeButton.addEventListener('click', () => {
        inscribeUI(); // Navigate to inscribe UI
    });
    landingPage.appendChild(inscribeButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button back-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        mintSelectionUI(); // Navigate back to mint selection UI
    });
    landingPage.appendChild(backButton);

    // Function to handle file selection
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.size <= 100 * 1024) { // 100 KB
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64 = e.target.result.split(',')[1];
                const hex = base64ToHex(base64);
                const mimeType = file.type;
                const receivingAddress = addressInput.value; // Get the receiving address
                localStorage.setItem('fileToMint', JSON.stringify({ mimeType, hex, receivingAddress }));
                console.log('File and address saved to local storage:', { mimeType, hex, receivingAddress });
            };
            reader.readAsDataURL(file);
        } else {
            alert('File must be under 100 KB.');
        }
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

    // Function to sync the wallet and fetch UTXOs with script_hex
    async function syncWallet() {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        if (!selectedWallet) return;

        const { ticker, address } = selectedWallet;
        disableSyncButton(true);

        const apiUrl = 'https://blockchainplugz.com/api/v1';

        try {
            // Fetch balance
            const balanceResponse = await fetch(`${apiUrl}/get_address_balance/${ticker}/${address}`, {
                headers: {
                    'X-API-Key': apiKey
                }
            });
            const balanceData = await balanceResponse.json();
            if (balanceData.status === 'success') {
                selectedWallet.balance = balanceData.data.confirmed_balance;
                console.log(`Balance updated: ${selectedWallet.balance}`);
            } else {
                alert(balanceData.message);
            }

            // Fetch UTXOs
            const utxoResponse = await fetch(`${apiUrl}/get_tx_unspent/${ticker}/${address}`, {
                headers: {
                    'X-API-Key': apiKey
                }
            });
            const utxoData = await utxoResponse.json();
            if (utxoData.status === 'success') {
                const utxos = utxoData.data.txs.map(tx => ({
                    txid: tx.txid,
                    value: tx.value,
                    confirmations: tx.confirmations,
                    vout: tx.vout,
                    script_hex: tx.script_hex // Directly use script_hex from response
                }));

                selectedWallet.utxos = utxos;
                console.log('UTXOs updated with script_hex:', selectedWallet.utxos);
                // Update the dropdown
                walletDropdown.dispatchEvent(new Event('change'));
            } else {
                alert(utxoData.message);
            }
        } catch (error) {
            console.error('Error syncing wallet:', error);
            alert('An error occurred while syncing the wallet.');
        } finally {
            // Save updated wallets back to local storage
            localStorage.setItem('wallets', JSON.stringify(wallets));
            disableSyncButton(false);
        }
    }

    // Function to fetch transaction details for a given txid
    async function fetchTransactionDetails(txid) {
        try {
            const response = await fetch(`https://blockchainplugz.com/api/v1/get_transaction/${txid}`, {
                headers: {
                    'X-API-Key': apiKey
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                return data.data; // Adjust based on actual response structure
            } else {
                console.error(`Error fetching transaction ${txid}:`, data.message);
                return null;
            }
        } catch (error) {
            console.error(`Error fetching transaction ${txid}:`, error);
            return null;
        }
    }

    // Function to disable/enable the Sync button
    function disableSyncButton(disable) {
        syncButton.disabled = disable;
        syncButton.textContent = disable ? 'Syncing...' : 'Sync Wallet';
        syncButton.style.backgroundColor = disable ? '#555' : '#1f1f1f';
    }

    // Function to generate transactions
    function generateTransactions() {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        if (!selectedWallet) {
            alert('Please select a wallet.');
            return;
        }

        const [txid, vout] = utxoDropdown.value.split(':');
        const selectedUtxo = selectedWallet.utxos.find(utxo => utxo.txid === txid && utxo.vout == vout);

        console.log('Selected UTXO for Transaction:', selectedUtxo); // Log selected UTXO

        const fileData = JSON.parse(localStorage.getItem('fileToMint'));

        if (!selectedWallet || !selectedUtxo || !fileData) {
            alert('Please ensure all fields are selected and a file is uploaded.');
            return;
        }

        if (!selectedUtxo.script_hex) {
            alert('Script Hex is missing for the selected UTXO.');
            console.error('Missing script_hex:', selectedUtxo);
            return;
        }

        const requestBody = {
            receiving_address: fileData.receivingAddress,
            meme_type: fileData.mimeType,
            hex_data: fileData.hex,
            sending_address: selectedWallet.address,
            privkey: selectedWallet.privkey, // Ensure this is securely handled
            utxo: selectedUtxo.txid,
            vout: selectedUtxo.vout,
            script_hex: selectedUtxo.script_hex, // Now should be correctly set
            utxo_amount: selectedUtxo.value
        };

        console.log('Request Body:', requestBody); // Log the request body

        fetch(`https://blockchainplugz.com/api/v1/mint/${selectedWallet.ticker}`, { // Use the correct endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Mint response:', data);
            if (data.status === 'success') {
                console.log('Pending Transactions:', data.pendingTransactions); // Log pending transactions

                // Check if pendingTransactions is defined
                if (data.pendingTransactions) {
                    // Store pending transactions in local storage
                    localStorage.setItem('pendingTransactions', JSON.stringify(data.pendingTransactions));
                    console.log('Pending transactions saved to local storage.');
                } else {
                    console.error('No pending transactions found in response.');
                }

                localStorage.removeItem('fileToMint'); // Remove file hex from local storage
                alert('Transaction generated successfully!');
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error generating transaction:', error);
            alert('An error occurred while generating the transaction.');
        });
    }
}