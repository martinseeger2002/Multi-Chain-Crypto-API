// mintFileUI.js

import { mintSelectionUI } from './mintSelectionUI.js'; // Import the mintSelectionUI function
import { inscribeUI } from './inscribeUI.js'; // Import the inscribeUI function

/**
 * Function to initialize and render the Mint File UI.
 */
export function mintFileUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Create and append the page title
    const title = document.createElement('h1');
    title.textContent = 'Mint File';
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
    addressInput.placeholder = 'Enter receiving address';
    addressInput.className = 'styled-input'; // Use a class for styling
    landingPage.appendChild(addressInput);

    // File selection container
    const fileContainer = document.createElement('div');
    fileContainer.className = 'file-container'; // Use a class for styling

    // File selection input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'file-input';
    fileInput.style.display = 'none'; // Hide the default file input

    // File selection label
    const fileLabel = document.createElement('div');
    fileLabel.className = 'file-label'; // Use a class for styling

    // SVG Icon for the file label
    const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgIcon.setAttribute('width', '24');
    svgIcon.setAttribute('height', '24');
    svgIcon.setAttribute('fill', '#00bfff');
    svgIcon.setAttribute('viewBox', '0 0 24 24');
    svgIcon.innerHTML = `
        <path d="M12 2L12 14M12 14L8 10M12 14L16 10M4 18H20" stroke="#00bfff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `;

    // File label text
    const fileText = document.createElement('span');
    fileText.textContent = 'Choose File';
    fileText.className = 'file-text'; // Use a class for styling

    // Append SVG and text to the file label
    fileLabel.appendChild(svgIcon);
    fileLabel.appendChild(fileText);

    // Make the entire container clickable to trigger file input
    fileContainer.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection
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

    // **New Code: Clear Pending Transactions Button**
    const clearPendingButton = document.createElement('button');
    clearPendingButton.textContent = 'Clear Pending';
    clearPendingButton.className = 'styled-button'; // Use a class for styling
    clearPendingButton.addEventListener('click', () => {
        localStorage.removeItem('mintResponse'); // Clear pending transactions from local storage
        alert('Pending transactions cleared.');
    });
    landingPage.appendChild(clearPendingButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button back-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        mintSelectionUI(); // Navigate back to mint selection UI
    });
    landingPage.appendChild(backButton);

    /**
     * Function to handle file selection
     * @param {Event} event - The file selection event
     */
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.size <= 100 * 1024) { // 100 KB limit
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64 = e.target.result.split(',')[1];
                const hex = base64ToHex(base64);
                const mimeType = file.type;
                const receivingAddress = addressInput.value.trim(); // Get and trim the receiving address
                if (!receivingAddress) {
                    alert('Please enter a receiving address.');
                    return;
                }
                // **IMPORTANT:** Storing sensitive data like addresses should be done securely
                localStorage.setItem('fileToMint', JSON.stringify({ mimeType, hex, receivingAddress }));
                console.log('File and address saved to local storage:', { mimeType, hex, receivingAddress });
            };
            reader.readAsDataURL(file);
        } else {
            alert('File must be under 100 KB.');
        }
    }

    /**
     * Utility function to convert base64 to hex
     * @param {string} base64 - The base64 encoded string
     * @returns {string} - The hex representation of the base64 string
     */
    function base64ToHex(base64) {
        const raw = atob(base64);
        let result = '';
        for (let i = 0; i < raw.length; i++) {
            const hex = raw.charCodeAt(i).toString(16);
            result += (hex.length === 2 ? hex : '0' + hex);
        }
        return result.toUpperCase();
    }

    /**
     * Function to generate transactions
     */
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
                    let existingHexes = JSON.parse(localStorage.getItem('transactionHexes')) || [];

                    // Extract hex data from pendingTransactions
                    const newHexes = data.pendingTransactions.map(tx => tx.hex);

                    // Append new hexes to the existing list
                    existingHexes.push(...newHexes);

                    // Save the updated list back to local storage
                    localStorage.setItem('transactionHexes', JSON.stringify(existingHexes));
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

                    localStorage.setItem('mintResponse', JSON.stringify({ pendingTransactions }));
                    console.log('Mint response saved successfully.');
                } catch (error) {
                    console.error('Error saving mintResponse to local storage:', error);
                    alert('An error occurred while saving the mint response.');
                }

                localStorage.removeItem('fileToMint'); // Remove file hex from local storage
                alert('Transaction generated successfully!');
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
}
