import { mintSelectionUI } from './mintSelectionUI.js'; // Adjust the path as necessary

export function myInscriptionUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Title
    const title = document.createElement('h1');
    title.textContent = 'My Inscriptions';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    landingPage.appendChild(buttonContainer);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        mintSelectionUI(); // Navigate back to mint selection UI
    });
    buttonContainer.appendChild(backButton);

    // Delete all unnamed inscriptions button
    const deleteUnnamedButton = document.createElement('button');
    deleteUnnamedButton.textContent = 'Delete All Unnamed';
    deleteUnnamedButton.className = 'styled-button'; // Use a class for styling
    deleteUnnamedButton.addEventListener('click', () => {
        deleteAllUnnamedInscriptions();
    });
    buttonContainer.appendChild(deleteUnnamedButton);

    // Container for the inscription list
    const inscriptionListContainer = document.createElement('div');
    inscriptionListContainer.className = 'inscription-list-container';
    landingPage.appendChild(inscriptionListContainer);

    // Retrieve and display inscriptions
    const inscriptionList = document.createElement('ul');
    inscriptionList.className = 'inscription-list'; // Add a class for styling
    const myInscriptions = JSON.parse(localStorage.getItem('MyInscriptions')) || [];
    updateInscriptionList(myInscriptions);
    inscriptionListContainer.appendChild(inscriptionList);

    // Function to update the inscription list
    function updateInscriptionList(inscriptions) {
        inscriptionList.innerHTML = ''; // Clear existing list
        inscriptions.forEach(inscription => {
            const listItem = document.createElement('li');
            listItem.className = 'inscription-item'; // Add a class for styling

            // Create button for the inscription name
            const nameButton = document.createElement('button');
            nameButton.textContent = inscription.name || 'Unnamed';
            nameButton.className = 'styled-button'; // Use a class for styling
            nameButton.addEventListener('click', () => {
                displayInscriptionContent(inscription.txid);
            });

            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'X';
            deleteButton.style.backgroundColor = 'red';
            deleteButton.style.color = 'white';
            deleteButton.style.border = 'none';
            deleteButton.style.width = '24px';
            deleteButton.style.height = '24px';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.marginLeft = '10px';
            deleteButton.style.display = 'flex';
            deleteButton.style.alignItems = 'center';
            deleteButton.style.justifyContent = 'center';
            deleteButton.style.fontFamily = 'Arial, sans-serif';
            deleteButton.style.fontSize = '16px';
            deleteButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this inscription?')) {
                    deleteInscription(inscription);
                }
            });

            // Add buttons to the list item
            listItem.appendChild(nameButton);
            listItem.appendChild(deleteButton);
            inscriptionList.appendChild(listItem);
        });
    }

    // Function to display inscription content
    function displayInscriptionContent(txid) {
        landingPage.innerHTML = ''; // Clear existing content

        const iframeWrapper = document.createElement('div');
        iframeWrapper.style.position = 'relative';
        iframeWrapper.style.width = '300px';
        iframeWrapper.style.paddingTop = '300px'; // 1:1 Aspect Ratio
        landingPage.appendChild(iframeWrapper);

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '300px';
        iframe.style.height = '300px';
        iframe.style.border = 'none';
        iframeWrapper.appendChild(iframe);

        const contentUrl = `https://blockchainplugz.com/content/${txid}i0`;

        fetch(contentUrl, { method: 'HEAD' })
            .then(response => {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.startsWith('image/')) {
                    iframe.srcdoc = `<style>
                                        body, html { margin: 0; height: 100%; display: flex; justify-content: center; align-items: center; }
                                        img { max-width: 100%; max-height: 100%; }
                                     </style>
                                     <img src="${contentUrl}" alt="Image Content">`;
                } else {
                    iframe.src = contentUrl;
                }
            })
            .catch(error => {
                console.error('Error fetching content:', error);
                iframe.src = contentUrl; // Fallback to direct link
            });

        // Refresh button
        const refreshButton = document.createElement('button');
        refreshButton.textContent = 'Refresh';
        refreshButton.className = 'styled-button'; // Use a class for styling
        refreshButton.addEventListener('click', () => {
            iframe.src = iframe.src; // Refresh the iframe
        });
        landingPage.appendChild(refreshButton);

        // Back button to return to the list
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.className = 'styled-button'; // Use a class for styling
        backButton.addEventListener('click', () => {
            myInscriptionUI(); // Reload the list UI
        });
        landingPage.appendChild(backButton);
    }

    // Function to delete an inscription
    function deleteInscription(inscription) {
        const updatedInscriptions = myInscriptions.filter(item => item.txid !== inscription.txid);
        localStorage.setItem('MyInscriptions', JSON.stringify(updatedInscriptions));
        updateInscriptionList(updatedInscriptions); // Refresh the list after deletion
    }

    // Function to delete all unnamed inscriptions
    function deleteAllUnnamedInscriptions() {
        const updatedInscriptions = myInscriptions.filter(item => item.name);
        localStorage.setItem('MyInscriptions', JSON.stringify(updatedInscriptions));
        updateInscriptionList(updatedInscriptions); // Refresh the list after deletion
    }
}
