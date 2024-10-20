import { addWalletUI } from './addWalletUI.js';
import { walletUI } from './walletUI.js';


export function manageWalletsUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Manage Wallets';
    landingPage.appendChild(title);

    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];

    const walletDropdown = document.createElement('select');
    walletDropdown.style.display = 'block';
    walletDropdown.style.margin = '10px auto';

    wallets.forEach((wallet, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = wallet.label;
        walletDropdown.appendChild(option);
    });

    landingPage.appendChild(walletDropdown);

    const walletOptionsDiv = document.createElement('div');
    walletOptionsDiv.style.textAlign = 'center';
    landingPage.appendChild(walletOptionsDiv);

    walletDropdown.addEventListener('change', (event) => {
        const selectedWallet = wallets[event.target.value];
        displayWalletOptions(selectedWallet, walletOptionsDiv, wallets);
    });

    if (wallets.length > 0) {
        displayWalletOptions(wallets[0], walletOptionsDiv, wallets);
    }

    const addWalletButton = document.createElement('button');
    addWalletButton.textContent = 'Add Wallet';
    addWalletButton.style.display = 'block';
    addWalletButton.style.margin = '10px auto';
    addWalletButton.addEventListener('click', addWalletUI);
    landingPage.appendChild(addWalletButton);

    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.style.display = 'block';
    backButton.style.margin = '10px auto';
    backButton.addEventListener('click', walletUI);
    landingPage.appendChild(backButton);
}

function displayWalletOptions(wallet, container, wallets) {
    container.innerHTML = ''; // Clear previous options

    const walletLabel = document.createElement('div');
    walletLabel.textContent = wallet.label;
    walletLabel.style.fontWeight = 'bold';
    container.appendChild(walletLabel);

    const renameButton = document.createElement('button');
    renameButton.textContent = 'Rename';
    renameButton.style.display = 'block';
    renameButton.style.margin = '5px auto';
    renameButton.addEventListener('click', () => renameWallet(wallet, wallets));

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.style.display = 'block';
    deleteButton.style.margin = '5px auto';
    deleteButton.style.backgroundColor = 'red';
    deleteButton.style.color = 'white';
    deleteButton.addEventListener('click', () => deleteWallet(wallet, wallets));

    const viewPrivateKeyButton = document.createElement('button');
    viewPrivateKeyButton.textContent = 'View Private Key';
    viewPrivateKeyButton.style.display = 'block';
    viewPrivateKeyButton.style.margin = '5px auto';
    viewPrivateKeyButton.addEventListener('click', () => viewPrivateKey(wallet));

    const tickerDropdown = document.createElement('select');
    const tickerOptions = ['DOGE', 'LTC', 'LKY'];
    tickerOptions.forEach(ticker => {
        const option = document.createElement('option');
        option.value = ticker;
        option.textContent = ticker;
        if (wallet.ticker === ticker) {
            option.selected = true;
        }
        tickerDropdown.appendChild(option);
    });

    tickerDropdown.addEventListener('change', (event) => {
        wallet.ticker = event.target.value;
        localStorage.setItem('wallets', JSON.stringify(wallets));
        manageWalletsUI(); // Refresh the UI
    });

    container.appendChild(renameButton);
    container.appendChild(deleteButton);
    container.appendChild(viewPrivateKeyButton);
    container.appendChild(tickerDropdown);
}

function renameWallet(wallet, wallets) {
    const newLabel = prompt('Enter new label:', wallet.label);
    if (newLabel) {
        wallet.label = newLabel;
        localStorage.setItem('wallets', JSON.stringify(wallets));
        manageWalletsUI(); // Refresh the UI
    }
}

function deleteWallet(wallet, wallets) {
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
    const wifPrivkey = wallet.privkey;
    alert(`WIF Private Key: ${wifPrivkey}`);
}
