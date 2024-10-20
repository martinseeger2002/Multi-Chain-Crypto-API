import { mintFileUI } from './mintFileUI.js'; // Adjust the path as necessary

export function inscribeUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Inscribe Transactions';
    title.style.color = '#00bfff'; // Set to blue hue
    landingPage.appendChild(title);

    // Retrieve and display pending transactions
    const pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions')) || [];
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
    inscribeButton.style.margin = '10px 0';
    inscribeButton.style.backgroundColor = '#00bfff'; // Set to blue hue
    inscribeButton.style.color = '#fff'; // Set text color to white
    landingPage.appendChild(inscribeButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.style.margin = '10px 0';
    backButton.style.backgroundColor = '#00bfff'; // Set to blue hue
    backButton.style.color = '#fff'; // Set text color to white
    backButton.addEventListener('click', () => {
        mintFileUI(); // Navigate back to mint file UI
    });
    landingPage.appendChild(backButton);
}
