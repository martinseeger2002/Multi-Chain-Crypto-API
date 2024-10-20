import { mintFileUI } from './mintFileUI.js';


export function mintSelectionUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Mint Selection';
    landingPage.appendChild(title);

    // Display mint credits
    const creditsDisplay = document.createElement('div');
    creditsDisplay.style.margin = '10px 0';
    landingPage.appendChild(creditsDisplay);

    fetch('/api/v1/mint_credits')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                creditsDisplay.textContent = `Mint Credits: ${data.credits}`;
            } else {
                creditsDisplay.textContent = 'Error fetching mint credits';
            }
        })
        .catch(error => {
            console.error('Error fetching mint credits:', error);
            creditsDisplay.textContent = 'Error fetching mint credits';
        });

    // Mint File button
    const mintFileButton = document.createElement('button');
    mintFileButton.textContent = 'Mint File';
    mintFileButton.addEventListener('click', () => {
        mintFileUI(); // Navigate to mint file UI
    });
    landingPage.appendChild(mintFileButton);

    // Add more UI elements for mint selection as needed
}
