import { mintSelectionUI } from './mintSelectionUI.js'; // Adjust the path as necessary

export function myInscriptionUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // State tracking variable
    let currentState = 'walletList'; // 'walletList' or 'jsonView'

    // Title
    const title = document.createElement('h1');
    title.textContent = 'My Inscriptions';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        if (currentState === 'walletList') {
            mintSelectionUI(); // Go back to mint selection UI
        } else if (currentState === 'jsonView') {
            showWalletList(); // Go back to the wallet list
        }
    });
    landingPage.appendChild(backButton);

    // Scrollable text container
    const textContainer = document.createElement('div');
    textContainer.className = 'scrollable-text-container'; // Add a class for styling
    landingPage.appendChild(textContainer);

    // Function to display the wallet list
    function showWalletList() {
        currentState = 'walletList';
        textContainer.innerHTML = ''; // Clear text container

        // Retrieve and process 'MyInscriptions' from localStorage
        const myInscriptions = JSON.parse(localStorage.getItem('MyInscriptions')) || [];

        // Create a map of addresses to inscriptions
        const addressMap = {};

        myInscriptions.forEach(inscription => {
            const address = inscription.sendingaddress || 'Wallet Not defined';
            if (!addressMap[address]) {
                addressMap[address] = [];
            }
            addressMap[address].push(inscription);
        });

        // Display the addresses with the number of inscriptions
        for (const address in addressMap) {
            const addressItem = document.createElement('div');
            addressItem.className = 'address-item'; // Use a class for styling
            addressItem.textContent = `${address} (${addressMap[address].length})`;
            addressItem.style.cursor = 'pointer'; // Indicate that it's clickable

            // Click event to display inscriptions for this address
            addressItem.addEventListener('click', () => {
                showInscriptionsForAddress(address, addressMap[address]);
            });

            textContainer.appendChild(addressItem);
        }
    }

    // Function to display inscriptions for a specific address
    function showInscriptionsForAddress(address, inscriptions) {
        currentState = 'jsonView';
        textContainer.innerHTML = ''; // Clear text container

        // Create a preformatted text element to display JSON data
        const pre = document.createElement('pre');
        pre.className = 'json-display'; // Use a class for styling

        // Prepare the data to display
        const dataToDisplay = inscriptions.map(inscription => ({
            name: inscription.name,
            txid: inscription.txid
        }));

        pre.textContent = JSON.stringify(dataToDisplay, null, 2); // Pretty print with indentation
        textContainer.appendChild(pre);
    }

    // Initialize the UI by showing the wallet list
    showWalletList();
}
