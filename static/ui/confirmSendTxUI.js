export function confirmSendTxUI(transactionData) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Confirm Transaction';
    landingPage.appendChild(title);

    const detailsDiv = document.createElement('div');
    detailsDiv.style.margin = '20px 0';

    const recipientsList = document.createElement('ul');
    transactionData.recipients.forEach(recipient => {
        const listItem = document.createElement('li');
        listItem.textContent = `Address: ${recipient.address}, Amount: ${recipient.amount} sats`;
        recipientsList.appendChild(listItem);
    });

    const feeDetail = document.createElement('div');
    feeDetail.textContent = `Fee: ${transactionData.fee} sats`;

    const changeAddressDetail = document.createElement('div');
    changeAddressDetail.textContent = `Change Address: ${transactionData.changeAddress}`;

    detailsDiv.appendChild(recipientsList);
    detailsDiv.appendChild(feeDetail);
    detailsDiv.appendChild(changeAddressDetail);
    landingPage.appendChild(detailsDiv);

    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.style.margin = '10px';
    sendButton.addEventListener('click', () => {
        // Implement the send transaction logic here
        alert('Transaction sent!');
    });

    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.style.margin = '10px';
    backButton.addEventListener('click', () => sendTxUI(transactionData.selectedLabel));

    landingPage.appendChild(sendButton);
    landingPage.appendChild(backButton);
}
