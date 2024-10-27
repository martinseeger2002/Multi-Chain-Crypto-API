import { walletUI } from './walletUI.js';
import { mintSelectionUI } from './mintSelectionUI.js';
import { userUI } from './userUI.js'; // Import the userUI function
import { addWalletUI } from './addWalletUI.js'; // Import the addWalletUI function
import { terminalUI } from './terminalUI.js'; // Import the terminalUI function

export function landingPageUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Retrieve stored styles and text
    const storedTitleText = localStorage.getItem('titleText') || 'Plugz Wallet';
    const storedTitleColor = localStorage.getItem('titleColor') || '#a0b9e6';

    // Set styles for the landing page
    landingPage.className = 'landing-page'; // Use a class for styling

    const title = document.createElement('h1');
    title.textContent = storedTitleText;
    title.style.color = storedTitleColor; // Use stored color
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Store title text and color when page is unloaded
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('titleText', title.textContent);
        localStorage.setItem('titleColor', title.style.color);
    });

    // Create buttons
    const buttons = [
        { 
            text: 'Wallet', 
            onClick: () => {
                const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
                if (wallets.length === 0) {
                    addWalletUI(); // Redirect to addWalletUI if no wallets exist
                } else {
                    walletUI();
                }
            }
        },
        { text: 'Mint', onClick: mintSelectionUI },
        { text: 'Vault (Coming Soon)', onClick: () => { /* Add functionality here */ } },
        { text: 'User', onClick: userUI },
        { text: 'Buy Mint Credits (Coming Soon)', onClick: () => { /* Add functionality here */ } }, // New button
        { text: 'Terminal', onClick: terminalUI } // Add Terminal button
    ];

    buttons.forEach(({ text, onClick }) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'styled-button'; // Use a class for styling
        button.addEventListener('click', onClick);
        landingPage.appendChild(button);
    });
    

    syncAllWallets(selectedWalletLabel);
}

async function syncAllWallets(selectedWalletLabel) {
    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
    const apiUrl = 'https://blockchainplugz.com/api/v1';

    for (const wallet of wallets) {
        const { ticker, address } = wallet;

        try {
            const response = await fetch(`${apiUrl}/get_tx_unspent/${ticker}/${address}`, {
                headers: {
                    'X-API-Key': apiKey
                }
            });

            const data = await response.json();
            console.log(`UTXO Response for ${wallet.label}:`, data);

            if (data.status === 'success') {
                wallet.utxos = data.data.txs.map(tx => ({
                    txid: tx.txid,
                    value: tx.value,
                    confirmations: tx.confirmations,
                    vout: tx.vout,
                    script_hex: tx.script_hex
                }));
                console.log(`UTXOs updated for ${wallet.label}:`, wallet.utxos);

                wallet.balance = wallet.utxos
                    .filter(utxo => parseFloat(utxo.value) > 0.01)
                    .reduce((acc, utxo) => acc + parseFloat(utxo.value), 0);
            } else {
                alert(`Error syncing wallet "${wallet.label}": ${data.message}`);
            }
        } catch (error) {
            console.error(`Error fetching UTXOs for wallet "${wallet.label}":`, error);
        }
    }

    localStorage.setItem('wallets', JSON.stringify(wallets));

    if (selectedWalletLabel) {
        const selectedWallet = wallets.find(wallet => wallet.label === selectedWalletLabel);
        if (selectedWallet) {
            console.log(`Balance updated for ${selectedWallet.label}: ${selectedWallet.balance || 'N/A'}`);
        }
    }
}
