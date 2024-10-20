import { broadcastTransactions } from '../api/broadcastTransactions.js';

export function broadcastInscriptionUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Broadcast Pending Transactions';
    landingPage.appendChild(title);

    // Retrieve pending transactions from local storage
    const pendingTxs = JSON.parse(localStorage.getItem('pendingTxs')) || [];

    if (pendingTxs.length === 0) {
        const noTxMessage = document.createElement('p');
        noTxMessage.textContent = 'No pending transactions to broadcast.';
        landingPage.appendChild(noTxMessage);
        return;
    }

    // Create a list to display pending transactions
    const txList = document.createElement('ul');
    pendingTxs.forEach((txHex, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Transaction ${index + 1}: ${txHex}`;
        txList.appendChild(listItem);
    });
    landingPage.appendChild(txList);

    // Broadcast button
    const broadcastButton = document.createElement('button');
    broadcastButton.textContent = 'Broadcast All Transactions';
    broadcastButton.style.marginTop = '20px';
    broadcastButton.addEventListener('click', () => {
        broadcastTransactions(pendingTxs);
    });
    landingPage.appendChild(broadcastButton);

    // Function to broadcast transactions
    function broadcastTransactions(transactions) {
        const apiUrl = 'https://blockchainplugz.com/api/v1/send_raw_tx/<ticker>'; // Replace <ticker> with actual ticker

        transactions.forEach(async (txHex) => {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': apiKey
                    },
                    body: JSON.stringify({ tx_hex: txHex })
                });

                const data = await response.json();
                if (data.status === 'success') {
                    console.log(`Transaction broadcasted successfully: ${data.data.txid}`);
                    alert(`Transaction broadcasted successfully: ${data.data.txid}`);
                } else {
                    console.error(`Error broadcasting transaction: ${data.message}`);
                    alert(`Error broadcasting transaction: ${data.message}`);
                }
            } catch (error) {
                console.error('Error broadcasting transaction:', error);
                alert('An error occurred while broadcasting the transaction.');
            }
        });

        // Clear pending transactions after broadcasting
        localStorage.removeItem('pendingTxs');
    }
}
