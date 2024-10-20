import { addWalletUI } from './addWalletUI.js';
import { walletUI } from './walletUI.js';


export function manageWalletsUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Manage Wallets';
    landingPage.appendChild(title);

    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];

    wallets.forEach(wallet => {
        const walletDiv = document.createElement('div');
        walletDiv.style.marginBottom = '10px'; // Add some space between wallet entries
        walletDiv.style.textAlign = 'center'; // Center the content

        const walletLabel = document.createElement('div');
        walletLabel.textContent = wallet.label; // Display only the label
        walletLabel.style.fontWeight = 'bold'; // Optional: make the label bold
        walletDiv.appendChild(walletLabel);

        const renameButton = document.createElement('button');
        renameButton.textContent = 'Rename';
        renameButton.style.display = 'block'; // Display buttons as block elements
        renameButton.style.margin = '5px auto'; // Center the button
        renameButton.addEventListener('click', () => renameWallet(wallet));

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.style.display = 'block'; // Display buttons as block elements
        deleteButton.style.margin = '5px auto'; // Center the button
        deleteButton.style.backgroundColor = 'red'; // Make the button red
        deleteButton.style.color = 'white'; // Set text color to white
        deleteButton.addEventListener('click', () => deleteWallet(wallet));

        const viewPrivateKeyButton = document.createElement('button');
        viewPrivateKeyButton.textContent = 'View Private Key';
        viewPrivateKeyButton.style.display = 'block'; // Display buttons as block elements
        viewPrivateKeyButton.style.margin = '5px auto'; // Center the button
        viewPrivateKeyButton.addEventListener('click', () => viewPrivateKey(wallet));

        const tickerDropdown = document.createElement('select');
        const tickerOptions = ['DOGE', 'LTC', 'LKY']; // Example ticker options
        tickerOptions.forEach(ticker => {
            const option = document.createElement('option');
            option.value = ticker;
            option.textContent = ticker;
            if (wallet.ticker === ticker) {
                option.selected = true; // Set the current ticker as selected
            }
            tickerDropdown.appendChild(option);
        });

        tickerDropdown.addEventListener('change', (event) => {
            wallet.ticker = event.target.value;
            localStorage.setItem('wallets', JSON.stringify(wallets));
            manageWalletsUI(); // Refresh the UI
        });

        walletDiv.appendChild(renameButton);
        walletDiv.appendChild(deleteButton);
        walletDiv.appendChild(viewPrivateKeyButton);
        walletDiv.appendChild(tickerDropdown);
        landingPage.appendChild(walletDiv);
    });

    const addWalletButton = document.createElement('button');
    addWalletButton.textContent = 'Add Wallet';
    addWalletButton.style.display = 'block'; // Display button as block element
    addWalletButton.style.margin = '10px auto'; // Center the button
    addWalletButton.addEventListener('click', addWalletUI);
    landingPage.appendChild(addWalletButton);

    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.style.display = 'block'; // Display button as block element
    backButton.style.margin = '10px auto'; // Center the button
    backButton.addEventListener('click', walletUI);
    landingPage.appendChild(backButton);

    function renameWallet(wallet) {
        const newLabel = prompt('Enter new label:', wallet.label);
        if (newLabel) {
            wallet.label = newLabel;
            localStorage.setItem('wallets', JSON.stringify(wallets));
            manageWalletsUI(); // Refresh the UI
        }
    }

    function deleteWallet(wallet) {
        const confirmDelete = confirm(`Are you sure you want to delete the wallet: ${wallet.label}? Make sure to back up your private keys or they will be lost.`);
        if (confirmDelete) {
            const index = wallets.indexOf(wallet);
            if (index > -1) {
                wallets.splice(index, 1);
                localStorage.setItem('wallets', JSON.stringify(wallets));
                manageWalletsUI(); // Refresh the UI
            }
        }
    }

    function viewPrivateKey(wallet) {
        const wifPrivkey = wallet.privkey; // Use 'privkey' to match the storage key
        alert(`WIF Private Key: ${wifPrivkey}`);
    }
}
