import { landingPageUI } from './landingPageUI.js'; // Import the landingPageUI function
import { mintPadDogeUI } from './mintPadDogeUI.js';
import { mintPadPepeUI } from './mintPadPepeUI.js';

export function mintPadUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Mint Pad';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Doge button
    const dogeButton = document.createElement('button');
    dogeButton.textContent = 'Doge';
    dogeButton.className = 'styled-button doge-button'; // Use a class for styling
    dogeButton.addEventListener('click', () => {
        mintPadDogeUI(); // Load mintPadDogeUI
    });
    landingPage.appendChild(dogeButton);

    // Pepe button
    const pepeButton = document.createElement('button');
    pepeButton.textContent = 'Pepe';
    pepeButton.className = 'styled-button pepe-button'; // Use a class for styling
    pepeButton.addEventListener('click', () => {
        mintPadPepeUI(); // Add event listener for Pepe button
    });
    landingPage.appendChild(pepeButton);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button back-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        landingPageUI(); // Navigate back to landing page UI
    });
    landingPage.appendChild(backButton);
}

// Helper function to write to localStorage with logging
function writeToLocalStorage(key, value) {
    console.log(`Write to localStorage [${key}]:`, value);
    localStorage.setItem(key, JSON.stringify(value));
}