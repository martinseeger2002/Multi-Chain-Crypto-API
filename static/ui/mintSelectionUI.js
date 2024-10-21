import { mintFileUI } from './mintFileUI.js';
import { landingPageUI } from './landingPageUI.js'; // Import the landingPageUI function
import { myInscriptionUI } from './myInscriptionUI.js'; // Import the myInscriptionUI function


export function mintSelectionUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Mint Selection';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Display mint credits
    const creditsDisplay = document.createElement('div');
    creditsDisplay.className = 'credits-display'; // Use a class for styling
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
    mintFileButton.className = 'styled-button'; // Use a class for styling
    mintFileButton.addEventListener('click', () => {
        mintFileUI(); // Navigate to mint file UI
    });
    landingPage.appendChild(mintFileButton);

    // My Inscriptions button
    const myInscriptionsButton = document.createElement('button');
    myInscriptionsButton.textContent = 'My Inscriptions';
    myInscriptionsButton.className = 'styled-button'; // Use a class for styling
    myInscriptionsButton.addEventListener('click', () => {
        myInscriptionUI(); // Navigate to my inscriptions UI
    });
    landingPage.appendChild(myInscriptionsButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button back-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        landingPageUI(); // Navigate back to landing page UI
    });
    landingPage.appendChild(backButton);

    // Add more UI elements for mint selection as needed
}
