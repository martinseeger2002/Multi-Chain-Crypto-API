import { manageWalletsUI } from './manageWalletsUI.js';
import { landingPageUI } from './landingPageUI.js';
import { viewUtxoUI } from './viewUtxoUI.js';
import { sendTxUI } from './sendTxUI.js';


export function walletUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Wallet';
    landingPage.appendChild(title);

    const walletDropdown = document.createElement('select');
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
                        vout: tx.output_no,
                        script_hex: tx.script_hex // Ensure script_hex is mapped
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
