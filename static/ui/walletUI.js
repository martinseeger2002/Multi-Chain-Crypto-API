import { manageWalletsUI } from './manageWalletsUI.js';
import { landingPageUI } from './landingPageUI.js';
import { viewUtxoUI } from './viewUtxoUI.js';
import { sendTxUI } from './sendTxUI.js';


export function walletUI(selectedWalletLabel = null) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Apply styles to the landing page
    landingPage.style.padding = '20px';
    landingPage.style.fontFamily = 'Courier New, monospace'; // Use a monospace font for a techy look
    landingPage.style.backgroundColor = '#1a1a1a'; // Dark background

    const title = document.createElement('h1');
    title.textContent = 'Wallet';
    landingPage.appendChild(title);

    // Style the title
    title.style.color = '#00bfff'; // Bright blue for a techy feel
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';

    const walletDropdown = document.createElement('select');
    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];

    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select a Wallet';
    defaultOption.disabled = true;
    walletDropdown.appendChild(defaultOption);

    wallets.forEach((wallet) => {
        const option = document.createElement('option');
        option.value = wallet.label;
        option.textContent = wallet.label;
        if (wallet.label === selectedWalletLabel) {
            option.selected = true; // Select the newly saved wallet
        }
        walletDropdown.appendChild(option);
    });

    const balanceDisplay = document.createElement('div');
    const addressDisplay = document.createElement('div');
    addressDisplay.style.textAlign = 'center'; // Center the address text
    const qrCodeDisplay = document.createElement('img');
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy Address';

    const syncButton = document.createElement('button');
    syncButton.textContent = 'Sync Wallet';
    syncButton.addEventListener('click', syncWallet);

    const viewUtxosButton = document.createElement('button');
    viewUtxosButton.textContent = 'View UTXOs';
    viewUtxosButton.addEventListener('click', () => viewUtxoUI(walletDropdown.value));

    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.disabled = true; // Disable by default
    sendButton.addEventListener('click', () => sendTxUI(walletDropdown.value));

    const manageWalletsButton = document.createElement('button');
    manageWalletsButton.textContent = 'Manage Wallets';
    manageWalletsButton.addEventListener('click', manageWalletsUI);

    walletDropdown.addEventListener('change', () => {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        if (selectedWallet) {
            balanceDisplay.textContent = `Balance: ${selectedWallet.balance || 'N/A'}`;
            addressDisplay.textContent = selectedWallet.address; // Display only the address
            qrCodeDisplay.src = `https://api.qrserver.com/v1/create-qr-code/?data=${selectedWallet.address}&size=150x150`;
            sendButton.disabled = false; // Enable send button
        } else {
            sendButton.disabled = true; // Disable send button if no wallet is selected
        }
    });

    // Trigger change event to update UI with the selected wallet's details
    if (selectedWalletLabel) {
        walletDropdown.dispatchEvent(new Event('change'));
    } else if (wallets.length > 0) {
        walletDropdown.dispatchEvent(new Event('change'));
    }

    copyButton.addEventListener('click', () => {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        if (selectedWallet) {
            navigator.clipboard.writeText(selectedWallet.address)
                .then(() => alert('Address copied to clipboard!'))
                .catch(err => console.error('Error copying address:', err));
        }
    });

    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.addEventListener('click', landingPageUI);

    // Style the balance and address display
    balanceDisplay.style.marginTop = '10px';
    balanceDisplay.style.fontSize = '18px';
    balanceDisplay.style.color = '#00bfff'; // Blue text

    addressDisplay.style.marginTop = '10px';
    addressDisplay.style.fontSize = '16px';
    addressDisplay.style.color = '#00bfff'; // Blue text

    // Style the QR code display
    qrCodeDisplay.style.display = 'block';
    qrCodeDisplay.style.margin = '20px auto';
    qrCodeDisplay.style.border = '2px solid #00bfff'; // Blue border

    // Style buttons
    const buttons = [copyButton, syncButton, viewUtxosButton, sendButton, manageWalletsButton, backButton];
    buttons.forEach(button => {
        button.style.width = '200px'; // Set a fixed width
        button.style.margin = '10px auto'; // Center the buttons
        button.style.padding = '10px';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.backgroundColor = '#333'; // Dark button background
        button.style.color = '#00bfff'; // Blue text
        button.style.cursor = 'pointer';
        button.style.transition = 'background-color 0.3s';
        
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#444'; // Slightly lighter on hover
        });
        
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#333';
        });
    });

    // Enhance background and font styles
    landingPage.style.backgroundImage = 'url("/static/images/MAINBKGD.webp")'; // Use the correct path
    landingPage.style.backgroundSize = 'cover';
    landingPage.style.backgroundPosition = 'center';
    landingPage.style.color = '#fff'; // White text for better contrast

    landingPage.appendChild(walletDropdown);
    landingPage.appendChild(balanceDisplay);
    landingPage.appendChild(addressDisplay);
    landingPage.appendChild(qrCodeDisplay);
    landingPage.appendChild(copyButton);
    landingPage.appendChild(syncButton);
    landingPage.appendChild(viewUtxosButton);
    landingPage.appendChild(sendButton);
    landingPage.appendChild(manageWalletsButton);
    landingPage.appendChild(backButton);

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
                console.log('Balance Response:', data); // Log the balance response
                if (data.status === 'success') {
                    selectedWallet.balance = data.data.confirmed_balance;
                    balanceDisplay.textContent = `Balance: ${selectedWallet.balance}`;
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
                console.log('UTXO Response:', data); // Log the UTXO response
                if (data.status === 'success') {
                    selectedWallet.utxos = data.data.txs.map(tx => ({
                        txid: tx.txid,
                        value: tx.value,
                        confirmations: tx.confirmations,
                        vout: tx.vout,
                        script_hex: tx.script_hex
                    }));
                    console.log('UTXOs updated:', selectedWallet.utxos); // Log the updated UTXOs
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
}
