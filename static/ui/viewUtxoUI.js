import { walletUI } from './walletUI.js';

export function viewUtxoUI(selectedLabel) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'UTXOs';
    landingPage.appendChild(title);

    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
    const selectedWallet = wallets.find(wallet => wallet.label === selectedLabel);

    if (selectedWallet && selectedWallet.utxos) {
        selectedWallet.utxos.forEach(utxo => {
            const utxoDiv = document.createElement('div');
            utxoDiv.textContent = `TXID: ${utxo.txid}, Value: ${utxo.value}, Confirmations: ${utxo.confirmations}, Vout: ${utxo.vout}`;
            landingPage.appendChild(utxoDiv);
        });
    } else {
        const noUtxosMessage = document.createElement('div');
        noUtxosMessage.textContent = 'No UTXOs available.';
        landingPage.appendChild(noUtxosMessage);
    }

    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.addEventListener('click', walletUI);
    landingPage.appendChild(backButton);
}
