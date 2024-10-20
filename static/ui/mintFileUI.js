import { mintSelectionUI } from './mintSelectionUI.js'; // Import the mintSelectionUI function

export function mintFileUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Mint File';
    landingPage.appendChild(title);

    // Display mint credits
    const creditsDisplay = document.createElement('div');
    creditsDisplay.style.margin = '10px 0';
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
    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
    wallets.forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.label;
        option.textContent = wallet.label;
        walletDropdown.appendChild(option);
    });
    landingPage.appendChild(walletDropdown);

    // UTXO dropdown
    const utxoDropdown = document.createElement('select');
    landingPage.appendChild(utxoDropdown);

    walletDropdown.addEventListener('change', () => {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        if (selectedWallet && selectedWallet.utxos) {
            utxoDropdown.innerHTML = ''; // Clear existing options
            selectedWallet.utxos.forEach(utxo => {
                const option = document.createElement('option');
                option.value = utxo.txid;
                option.textContent = `TXID: ${utxo.txid}, Value: ${utxo.value}`;
                utxoDropdown.appendChild(option);
            });
        }
    });

    utxoDropdown.addEventListener('change', () => {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        const selectedUtxo = selectedWallet.utxos.find(utxo => utxo.txid === utxoDropdown.value);
        if (selectedUtxo) {
            console.log('Selected UTXO:', selectedUtxo); // Log the selected UTXO information
        }
    });

    // Receiving address input
    const addressInput = document.createElement('input');
    addressInput.type = 'text';
    addressInput.placeholder = 'Enter receiving address';
    addressInput.style.margin = '10px 0';
    landingPage.appendChild(addressInput);

    // File selection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'file-input';
    fileInput.style.display = 'none'; // Hide the default file input

    const fileLabel = document.createElement('label');
    fileLabel.htmlFor = 'file-input';
    fileLabel.textContent = 'Choose File';
    fileLabel.className = 'styled-button'; // Use the same class as other buttons

    fileInput.addEventListener('change', handleFileSelect);
    landingPage.appendChild(fileInput);
    landingPage.appendChild(fileLabel);

    // Sync Wallet button
    const syncButton = document.createElement('button');
    syncButton.textContent = 'Sync Wallet';
    syncButton.style.margin = '10px 0';
    syncButton.addEventListener('click', syncWallet);
    landingPage.appendChild(syncButton);

    // Generate Transactions button
    const generateTxButton = document.createElement('button');
    generateTxButton.textContent = 'Generate Transactions';
    generateTxButton.style.margin = '10px 0';
    generateTxButton.addEventListener('click', generateTransactions);
    landingPage.appendChild(generateTxButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.style.margin = '10px 0';
    backButton.addEventListener('click', () => {
        mintSelectionUI(); // Navigate back to mint selection UI
    });
    landingPage.appendChild(backButton);

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

    function base64ToHex(base64) {
        const raw = atob(base64);
        let result = '';
        for (let i = 0; i < raw.length; i++) {
            const hex = raw.charCodeAt(i).toString(16);
            result += (hex.length === 2 ? hex : '0' + hex);
        }
        return result.toUpperCase();
    }

    function syncWallet() {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        if (!selectedWallet) return;

        const { ticker, address } = selectedWallet;
        disableSyncButton(true);

        const apiUrl = 'https://blockchainplugz.com/api/v1';

        Promise.all([
            fetch(`${apiUrl}/get_address_balance/${ticker}/${address}`, {
                headers: {
                    'X-API-Key': apiKey
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    selectedWallet.balance = data.data.confirmed_balance;
                    console.log(`Balance updated: ${selectedWallet.balance}`);
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching balance:', error);
                alert('An error occurred while fetching balance.');
            }),

            fetch(`${apiUrl}/get_tx_unspent/${ticker}/${address}`, {
                headers: {
                    'X-API-Key': apiKey
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    selectedWallet.utxos = data.data.txs.map(tx => ({
                        txid: tx.txid,
                        value: tx.value,
                        confirmations: tx.confirmations,
                        vout: tx.output_no // Ensure output_no is mapped to vout
                    }));
                    console.log('UTXOs updated:', selectedWallet.utxos);
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching UTXOs:', error);
                alert('An error occurred while fetching UTXOs.');
            })
        ])
        .finally(() => {
            // Save updated wallets back to local storage
            localStorage.setItem('wallets', JSON.stringify(wallets));
            disableSyncButton(false);
        });
    }

    function disableSyncButton(disable) {
        syncButton.disabled = disable;
        syncButton.textContent = disable ? 'Syncing...' : 'Sync Wallet';
        syncButton.style.backgroundColor = disable ? '#555' : '#1f1f1f';
    }

    function generateTransactions() {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        const selectedUtxo = selectedWallet.utxos.find(utxo => utxo.txid === utxoDropdown.value);
        const fileData = JSON.parse(localStorage.getItem('fileToMint'));

        if (!selectedWallet || !selectedUtxo || !fileData) {
            alert('Please ensure all fields are selected and a file is uploaded.');
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
            script_hex: selectedUtxo.script_hex || selectedWallet.script_hex, // Retrieve from UTXO or wallet
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
                const pendingTxs = JSON.parse(localStorage.getItem('pendingTxs')) || [];
                pendingTxs.push(data.transaction);
                localStorage.setItem('pendingTxs', JSON.stringify(pendingTxs));
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
