import { mintFileUI } from './mintFileUI.js'; // Adjust the path as necessary

export function inscribeUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Inscribe Transactions';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Retrieve and display pending transactions
    const mintResponse = JSON.parse(localStorage.getItem('mintResponse')) || {};
    const pendingTransactions = mintResponse.pendingTransactions || [];
    const txList = document.createElement('ul');
    pendingTransactions.forEach(tx => {
        const listItem = document.createElement('li');
        listItem.textContent = `Transaction Number: ${tx.transactionNumber}, TXID: ${tx.txid}`;
        txList.appendChild(listItem);
    });
    landingPage.appendChild(txList);

    // Inscribe button
    const inscribeButton = document.createElement('button');
    inscribeButton.textContent = 'Inscribe';
    inscribeButton.className = 'styled-button'; // Use a class for styling
    landingPage.appendChild(inscribeButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        mintFileUI(); // Navigate back to mint file UI
    });
    landingPage.appendChild(backButton);
}
