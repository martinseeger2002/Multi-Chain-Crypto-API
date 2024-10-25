import { walletUI } from './walletUI.js';

export function sendTxUI(selectedLabel) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Create and append the title
    const title = document.createElement('h1');
    title.textContent = 'Send Transaction';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Retrieve the selected wallet's UTXOs
    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
    const selectedWallet = wallets.find(wallet => wallet.label === selectedLabel);

    if (!selectedWallet || !selectedWallet.utxos) {
        const noUtxosMessage = document.createElement('div');
        noUtxosMessage.textContent = 'No UTXOs available.';
        noUtxosMessage.className = 'no-utxos-message'; // Use a class for styling
        landingPage.appendChild(noUtxosMessage);
        return;
    }

    // Display wallet details
    const sendingAddressDisplay = document.createElement('div');
    sendingAddressDisplay.textContent = `Sending Address: ${selectedWallet.address}`;
    sendingAddressDisplay.className = 'styled-text'; // Use a class for styling

    const wifPrivateKeyDisplay = document.createElement('div');
    wifPrivateKeyDisplay.textContent = `WIF Private Key: ${selectedWallet.privkey}`;
    wifPrivateKeyDisplay.className = 'styled-text'; // Use a class for styling

    const changeAddressDisplay = document.createElement('div');
    changeAddressDisplay.textContent = `Change Address: ${selectedWallet.address}`;
    changeAddressDisplay.className = 'styled-text'; // Use a class for styling

    // Create dropdown for UTXO selection
    const utxoDropdown = document.createElement('select');
    utxoDropdown.className = 'styled-select'; // Use a class for styling
    selectedWallet.utxos.forEach((utxo, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `TXID: ${utxo.txid}, Value: ${utxo.value}`;
        utxoDropdown.appendChild(option);
    });

    // Create text displays for UTXO details
    const txidDisplay = document.createElement('div');
    txidDisplay.className = 'styled-text'; // Use a class for styling

    const voutDisplay = document.createElement('div');
    voutDisplay.className = 'styled-text'; // Use a class for styling

    const scriptPubKeyDisplay = document.createElement('div');
    scriptPubKeyDisplay.className = 'styled-text'; // Use a class for styling

    // Update UTXO details when a new UTXO is selected
    function updateUtxoDetails() {
        const selectedUtxo = selectedWallet.utxos[utxoDropdown.value];
        txidDisplay.textContent = `TXID: ${selectedUtxo.txid}`;
        voutDisplay.textContent = `Vout: ${selectedUtxo.vout}`;
        scriptPubKeyDisplay.textContent = `ScriptPubKey: ${selectedUtxo.script_hex}`;
    }

    // Initialize UTXO details
    updateUtxoDetails();
    utxoDropdown.addEventListener('change', updateUtxoDetails);

    // Create input fields for transaction details
    const recipientAddressInput = document.createElement('input');
    recipientAddressInput.type = 'text';
    recipientAddressInput.placeholder = 'Recipient Address';
    recipientAddressInput.className = 'styled-input'; // Use a class for styling

    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.placeholder = 'Amount (sats)';
    amountInput.className = 'styled-input'; // Use a class for styling

    const feeInput = document.createElement('input');
    feeInput.type = 'number';
    feeInput.placeholder = 'Fee (sats)';
    feeInput.className = 'styled-input'; // Use a class for styling

    // Send Button
    const sendButton = document.createElement('button');
    sendButton.type = 'button';
    sendButton.textContent = 'Send';
    sendButton.className = 'styled-button'; // Use a class for styling
    sendButton.addEventListener('click', () => {
        const selectedUtxo = selectedWallet.utxos[utxoDropdown.value];
        const data = {
            sendingAddress: selectedWallet.address,
            wifPrivateKey: selectedWallet.privkey,
            utxos: [{
                txId: selectedUtxo.txid,
                vout: selectedUtxo.vout,
                amount: parseInt(amountInput.value, 10),
                scriptPubKey: selectedUtxo.script_hex
            }],
            recipients: [{
                address: recipientAddressInput.value.trim(),
                amount: parseInt(amountInput.value, 10)
            }],
            fee: parseInt(feeInput.value, 10),
            changeAddress: selectedWallet.address
        };


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
                alert(`Transaction Hex: ${result.data.transaction_hex}`);
            } else {
                alert(result.message);
            }
        })
        .catch(error => {
            console.error('Error generating transaction hex:', error);
            alert('An error occurred while generating the transaction hex.');
        });
    });

    // Append elements to landing page
    landingPage.appendChild(sendingAddressDisplay);
    landingPage.appendChild(wifPrivateKeyDisplay);
    landingPage.appendChild(changeAddressDisplay);
    landingPage.appendChild(utxoDropdown);
    landingPage.appendChild(txidDisplay);
    landingPage.appendChild(voutDisplay);
    landingPage.appendChild(scriptPubKeyDisplay);
    landingPage.appendChild(recipientAddressInput);
    landingPage.appendChild(amountInput);
    landingPage.appendChild(feeInput);
    landingPage.appendChild(sendButton);
}
