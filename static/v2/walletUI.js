export function walletUI() {
    const walletPage = document.getElementById('wallet-page');
    walletPage.innerHTML = ''; // Clear existing content

    // Retrieve stored wallet data
    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
    const selectedWalletLabel = localStorage.getItem('selectedWalletLabel');

    // Display selected wallet details
    const selectedWallet = wallets.find(wallet => wallet.label === selectedWalletLabel);
    if (selectedWallet) {
        const walletInfo = document.createElement('div');
        walletInfo.className = 'wallet-info';

        const balance = document.createElement('h2');
        balance.textContent = `Balance: ${selectedWallet.balance || 0}`;
        walletInfo.appendChild(balance);

        const utxos = document.createElement('p');
        utxos.textContent = `UTXOs: ${selectedWallet.utxos ? selectedWallet.utxos.length : 0}`;
        walletInfo.appendChild(utxos);

        walletPage.appendChild(walletInfo);
    } else {
        console.warn('No selected wallet found.');
    }

    // Create action buttons
    const actions = [
        { text: 'Send', onClick: () => console.log('Send action') },
        { text: 'Receive', onClick: () => console.log('Receive action') },
        { text: 'Mint', onClick: () => console.log('Mint action') },
        { text: 'Market', onClick: () => console.log('Market action') }
    ];

    actions.forEach(({ text, onClick }) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'action-button'; // Use a class for styling
        button.addEventListener('click', onClick);
        walletPage.appendChild(button);
    });

    // Optionally, add more UI elements or functionality as needed
}
