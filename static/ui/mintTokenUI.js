import { mintSelectionUI } from './mintSelectionUI.js';
import { inscribeUI } from './inscribeUI.js';

export function mintTokenUI(selectedWalletLabel = localStorage.getItem('selectedWalletLabel') || null) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Create and append the page title
    const title = document.createElement('h1');
    title.textContent = 'Mint Token';
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

    // Update UTXO dropdown and token standard based on selected wallet
    walletDropdown.addEventListener('change', () => {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        if (selectedWallet && selectedWallet.utxos && selectedWallet.utxos.length > 0) {
            utxoDropdown.innerHTML = ''; // Clear existing options
            selectedWallet.utxos
                .filter(utxo => parseFloat(utxo.value) >= 1.2 && utxo.confirmations >= 1)
                .forEach(utxo => {
                    const option = document.createElement('option');
                    option.value = `${utxo.txid}:${utxo.vout}`;
                    option.textContent = utxo.value;
                    utxoDropdown.appendChild(option);
                });
            if (selectedWallet.utxos.filter(utxo => parseFloat(utxo.value) >= 1.2 && utxo.confirmations >= 1).length === 0) {
                utxoDropdown.innerHTML = '<option disabled>No UTXOs available above 1.2 with sufficient confirmations</option>';
            }
        } else {
            utxoDropdown.innerHTML = '<option disabled>No UTXOs available</option>';
        }

        if (selectedWallet) {
            localStorage.setItem('selectedWalletLabel', selectedWallet.label);

            // Automatically select token standard based on wallet ticker
            if (selectedWallet.ticker === 'drc') {
                tokenStandardDropdown.value = 'drc-20';
            } else if (selectedWallet.ticker === 'lky') {
                tokenStandardDropdown.value = 'lky-20';
            }
        } else {
            localStorage.removeItem('selectedWalletLabel');
        }
    });

    if (selectedWalletLabel) {
        walletDropdown.value = selectedWalletLabel;
        walletDropdown.dispatchEvent(new Event('change'));
    }

    // Token standard selector
    const tokenStandardDropdown = document.createElement('select');
    tokenStandardDropdown.className = 'styled-select';
    ['drc-20', 'lky-20'].forEach(standard => {
        const option = document.createElement('option');
        option.value = standard;
        option.textContent = standard;
        tokenStandardDropdown.appendChild(option);
    });
    landingPage.appendChild(tokenStandardDropdown);

    // Operation selector
    const operationDropdown = document.createElement('select');
    operationDropdown.className = 'styled-select';
    ['mint', 'deploy', 'transfer'].forEach(op => {
        const option = document.createElement('option');
        option.value = op;
        option.textContent = op;
        operationDropdown.appendChild(option);
    });
    landingPage.appendChild(operationDropdown);

    // Tick input
    const tickInput = document.createElement('input');
    tickInput.type = 'text';
    tickInput.placeholder = 'plgz'; // Set default placeholder
    tickInput.className = 'styled-input';
    tickInput.autocapitalize = 'off'; // Disable auto-capitalization
    landingPage.appendChild(tickInput);

    // Amount input (conditionally displayed)
    const amountInput = document.createElement('input');
    amountInput.type = 'text';
    amountInput.placeholder = '420'; // Set default placeholder
    amountInput.className = 'styled-input';
    amountInput.autocapitalize = 'off'; // Disable auto-capitalization
    landingPage.appendChild(amountInput);

    // Max input (conditionally displayed)
    const maxInput = document.createElement('input');
    maxInput.type = 'text';
    maxInput.placeholder = 'Enter max supply';
    maxInput.className = 'styled-input';
    maxInput.autocapitalize = 'off'; // Disable auto-capitalization
    landingPage.appendChild(maxInput);

    // Limit input (conditionally displayed)
    const limitInput = document.createElement('input');
    limitInput.type = 'text';
    limitInput.placeholder = 'Enter limit';
    limitInput.className = 'styled-input';
    limitInput.autocapitalize = 'off'; // Disable auto-capitalization
    landingPage.appendChild(limitInput);

    // Receiving address input
    const addressInput = document.createElement('input');
    addressInput.type = 'text';
    addressInput.className = 'styled-input'; // Use a class for styling
    landingPage.appendChild(addressInput);

    // Prepopulate ticker, amount, and receiving address from local storage
    const lastMintedTicker = localStorage.getItem('lastMintedTicker');
    const lastMintedAmount = localStorage.getItem('lastMintedAmount');
    const lastReceivingAddress = localStorage.getItem('lastReceivingAddress');

    if (lastMintedTicker) {
        tickInput.value = lastMintedTicker;
    }
    if (lastMintedAmount) {
        amountInput.value = lastMintedAmount;
    }
    if (lastReceivingAddress) {
        addressInput.value = lastReceivingAddress;
    }

    // Set placeholder for receiving address based on selected wallet
    const selectedWallet = wallets.find(wallet => wallet.label === selectedWalletLabel);
    if (selectedWallet && selectedWallet.address) {
        addressInput.placeholder = selectedWallet.address;
    }

    // Show/hide inputs based on operation
    operationDropdown.addEventListener('change', () => {
        const op = operationDropdown.value;
        amountInput.style.display = (op === 'mint' || op === 'transfer') ? 'block' : 'none';
        maxInput.style.display = (op === 'deploy') ? 'block' : 'none';
        limitInput.style.display = (op === 'deploy') ? 'block' : 'none';

        // Only set default values if no stored values exist
        if (op === 'mint' && !lastMintedTicker) {
            tickInput.value = 'plgz'; // Prepopulate ticker
        }
        if (op === 'mint' && !lastMintedAmount) {
            amountInput.value = '420'; // Prepopulate amount
        }
    });
    operationDropdown.dispatchEvent(new Event('change'));

    // Generate Transactions button
    const generateTxButton = document.createElement('button');
    generateTxButton.textContent = 'Inscribe';
    generateTxButton.className = 'styled-button';
    generateTxButton.addEventListener('click', () => {
        // Save the current ticker, amount, and receiving address to local storage
        localStorage.setItem('lastMintedTicker', tickInput.value);
        localStorage.setItem('lastMintedAmount', amountInput.value);
        localStorage.setItem('lastReceivingAddress', addressInput.value);

        generateTransactions();
    });
    landingPage.appendChild(generateTxButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button back-button';
    backButton.addEventListener('click', () => {
        mintSelectionUI();
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

        // Determine receiving address
        const receivingAddressInput = addressInput.value.trim();
        let receivingAddress;

        if (!receivingAddressInput) {
            if (selectedWallet && selectedWallet.address) {
                receivingAddress = selectedWallet.address; // Default to the selected wallet's address
                console.log('No receiving address entered. Using selected wallet\'s address:', receivingAddress);
            } else {
                alert('Please enter a receiving address.');
                return;
            }
        } else {
            receivingAddress = receivingAddressInput;
        }

        // Construct token data
        const tokenData = {
            p: tokenStandardDropdown.value,
            op: operationDropdown.value,
            tick: tickInput.value
        };

        if (amountInput.style.display === 'block' && amountInput.value) {
            tokenData.amt = amountInput.value;
        }

        if (maxInput.style.display === 'block' && maxInput.value) {
            tokenData.max = maxInput.value;
        }

        if (limitInput.style.display === 'block' && limitInput.value) {
            tokenData.lim = limitInput.value;
        }

        const tokenDataString = JSON.stringify(tokenData);
        console.log('Token Data String:', tokenDataString);

        // Convert token data string to hex
        function stringToHex(str) {
            return str.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
        }
        const hexData = stringToHex(tokenDataString);
        console.log('Hex Data:', hexData);

        const requestBody = {
            receiving_address: receivingAddress,
            meme_type: 'text/plain',
            hex_data: hexData,
            sending_address: selectedWallet.address,
            privkey: selectedWallet.privkey,
            utxo: selectedUtxo.txid,
            vout: selectedUtxo.vout,
            script_hex: selectedUtxo.script_hex,
            utxo_amount: selectedUtxo.value
        };

        console.log('Request Body:', requestBody);

        fetch(`/api/v1/mint/${selectedWallet.ticker}`, {
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

                    localStorage.setItem('mintResponse', JSON.stringify({ pendingTransactions }));
                    console.log('Mint response saved successfully.');
                    
                    inscribeUI();
                } catch (error) {
                    console.error('Error saving mintResponse to local storage:', error);
                    alert('An error occurred while saving the mint response.');
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
                console.error('Mint API did not return pendingTransactions or it is empty:', data);
                alert(data.message || 'An error occurred.');
            }
        })
        .catch(error => {
            console.error('Error generating transaction:', error);
            alert('An error occurred while generating the transaction.');
        });
    }
}
