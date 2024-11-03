import { vaultSelectionUI } from './vaultSelectionUI.js';
import { inscribeUI } from './inscribeUI.js';

// Ensure the apiKey is defined and accessible here
const apiKey = 'your_actual_api_key_here'; // Replace with your valid API key

// Make sure to include the forge library in your HTML file:
// <script src="https://cdn.jsdelivr.net/npm/node-forge@0.10.0/dist/forge.min.js"></script>

function encryptWithPublicKey(data, publicKeyHex) {
    try {
        // Convert the public key from hex to bytes
        const publicKeyDer = forge.util.hexToBytes(publicKeyHex);
        const publicKeyAsn1 = forge.asn1.fromDer(publicKeyDer);
        const publicKey = forge.pki.publicKeyFromAsn1(publicKeyAsn1);

        // Encrypt the data using RSA-OAEP
        const encryptedData = publicKey.encrypt(data, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {
                md: forge.md.sha1.create()
            }
        });

        // Return the encrypted data as a hex string
        return forge.util.bytesToHex(encryptedData);
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data.');
    }
}

export function vaultTextUI(selectedWalletLabel = localStorage.getItem('selectedWalletLabel') || null) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Create and append the page title
    const title = document.createElement('h1');
    title.textContent = 'Vault Text';
    title.className = 'page-title';
    landingPage.appendChild(title);

    // Wallet dropdown
    const walletDropdown = document.createElement('select');
    walletDropdown.className = 'styled-select';
    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];

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
            option.selected = true;
        }
        walletDropdown.appendChild(option);
    });
    landingPage.appendChild(walletDropdown);

    // UTXO dropdown
    const utxoDropdown = document.createElement('select');
    utxoDropdown.className = 'styled-select';
    landingPage.appendChild(utxoDropdown);

    // Update UTXO dropdown based on selected wallet
    walletDropdown.addEventListener('change', () => {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        if (selectedWallet && selectedWallet.utxos && selectedWallet.utxos.length > 0) {
            utxoDropdown.innerHTML = ''; // Clear existing options
            selectedWallet.utxos
                .filter(utxo => parseFloat(utxo.value) > 0.01 && utxo.confirmations >= 1)
                .forEach(utxo => {
                    const option = document.createElement('option');
                    option.value = `${utxo.txid}:${utxo.vout}`;
                    option.textContent = utxo.value;
                    utxoDropdown.appendChild(option);
                });
            if (selectedWallet.utxos.filter(utxo => parseFloat(utxo.value) > 0.01 && utxo.confirmations >= 1).length === 0) {
                utxoDropdown.innerHTML = '<option disabled>No UTXOs available above 0.01 with sufficient confirmations</option>';
            }
        } else {
            utxoDropdown.innerHTML = '<option disabled>No UTXOs available</option>';
        }

        if (selectedWallet) {
            localStorage.setItem('selectedWalletLabel', selectedWallet.label);
        } else {
            localStorage.removeItem('selectedWalletLabel');
        }
    });

    if (selectedWalletLabel) {
        walletDropdown.value = selectedWalletLabel;
        walletDropdown.dispatchEvent(new Event('change'));
    }

    // Receiving address input
    const addressInput = document.createElement('input');
    addressInput.type = 'text';
    addressInput.placeholder = 'Enter receiving address (optional)';
    addressInput.className = 'styled-input';
    landingPage.appendChild(addressInput);

    // Textarea for text input
    const textArea = document.createElement('textarea');
    textArea.placeholder = 'Enter text to vault';
    textArea.className = 'styled-textarea';
    landingPage.appendChild(textArea);

    // Generate Transactions button
    const generateTxButton = document.createElement('button');
    generateTxButton.textContent = 'Inscribe';
    generateTxButton.className = 'styled-button';
    generateTxButton.addEventListener('click', generateTransactions);
    landingPage.appendChild(generateTxButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button back-button';
    backButton.addEventListener('click', () => {
        vaultSelectionUI();
    });
    landingPage.appendChild(backButton);

    function generateTransactions() {
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

        console.log('Selected UTXO for Transaction:', selectedUtxo);

        // Set MIME type for text data
        const pendingHexData = {
            mimeType: 'text/plain',
            hexData: ''
        };

        const receivingAddressInput = addressInput.value.trim();
        const receivingAddress = receivingAddressInput || selectedWallet.address;

        // Retrieve the text content from the textarea
        const messageToVault = textArea.value.trim();

        if (!messageToVault) {
            alert('Please enter a message to vault.');
            return;
        }

        // Fetch transaction to get public key
        fetch(`/api/v1/get_tx/${selectedWallet.ticker}/${txid}`, {
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'success') {
                throw new Error(data.message || 'Failed to fetch transaction data.');
            }

            // Find the public key script hex for the receiving address
            const pubKeyScriptHex = data.data.outputs.find(output => output.address === receivingAddress)?.script_hex;
            if (!pubKeyScriptHex) {
                alert('Public key for the receiving address not found.');
                return;
            }

            // Encrypt the message with the public key
            const encryptedHexData = encryptWithPublicKey(messageToVault, pubKeyScriptHex);

            pendingHexData.hexData = encryptedHexData;

            const requestBody = {
                receiving_address: receivingAddress,
                meme_type: pendingHexData.mimeType,
                hex_data: pendingHexData.hexData,
                sending_address: selectedWallet.address,
                privkey: selectedWallet.privkey,
                utxo: selectedUtxo.txid,
                vout: selectedUtxo.vout,
                script_hex: selectedUtxo.script_hex,
                utxo_amount: selectedUtxo.value
            };

            console.log('Request Body:', requestBody);

            fetch(`/api/v1/vault/${selectedWallet.ticker}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Response Data:', JSON.stringify(data, null, 2));

                if (data.pendingTransactions && Array.isArray(data.pendingTransactions) && data.pendingTransactions.length > 0) {
                    console.log('Pending Transactions:', data.pendingTransactions);

                    try {
                        let existingHexes = JSON.parse(localStorage.getItem('transactionHexes')) || [];
                        const newHexes = data.pendingTransactions.map(tx => tx.hex);
                        existingHexes.push(...newHexes);
                        localStorage.setItem('transactionHexes', JSON.stringify(existingHexes));
                        console.log('Transaction hexes saved successfully:', newHexes);
                    } catch (error) {
                        console.error('Error saving transaction hexes to local storage:', error);
                        alert('An error occurred while saving the transaction hexes.');
                    }

                    try {
                        const pendingTransactions = data.pendingTransactions.map(tx => ({
                            ...tx,
                            ticker: selectedWallet.ticker
                        }));

                        localStorage.setItem('vaultResponse', JSON.stringify({ pendingTransactions }));
                        console.log('Vault response saved successfully.');
                        
                        inscribeUI();
                    } catch (error) {
                        console.error('Error saving VaultResponse to local storage:', error);
                        alert('An error occurred while saving the vault response.');
                    }

                    try {
                        let pendingUTXOs = JSON.parse(localStorage.getItem('pendingUTXOs')) || [];
                        const usedUtxo = {
                            txid: selectedUtxo.txid,
                            vout: selectedUtxo.vout
                        };

                        const isAlreadyPending = pendingUTXOs.some(utxo => utxo.txid === usedUtxo.txid && utxo.vout === usedUtxo.vout);
                        if (!isAlreadyPending) {
                            pendingUTXOs.push(usedUtxo);
                            localStorage.setItem('pendingUTXOs', JSON.stringify(pendingUTXOs));
                            console.log('Pending UTXO saved:', usedUtxo);
                        } else {
                            console.log('UTXO is already marked as pending:', usedUtxo);
                        }
                    } catch (error) {
                        console.error('Error saving pending UTXOs to local storage:', error);
                        alert('An error occurred while saving the pending UTXO.');
                    }

                    localStorage.removeItem('pendingHexData');
                } else {
                    console.error('Vault API did not return pendingTransactions or it is empty:', data);
                    alert(data.message || 'An error occurred.');
                }
            })
            .catch(error => {
                console.error('Error generating transaction:', error);
                alert('An error occurred while generating the transaction.');
            });
        })
        .catch(error => {
            console.error('Error fetching transaction or encrypting data:', error);
            alert('An error occurred while processing the transaction.');
        });
    }
}
