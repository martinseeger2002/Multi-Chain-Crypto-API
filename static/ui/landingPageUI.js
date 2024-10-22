import { walletUI } from './walletUI.js';
import { mintSelectionUI } from './mintSelectionUI.js';
import { userUI } from './userUI.js'; // Import the userUI function

export function landingPageUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Retrieve stored styles and text
    const storedTitleText = localStorage.getItem('titleText') || 'Welcome to Blockchain Plugz Multi-Chain Wallet';
    const storedTitleColor = localStorage.getItem('titleColor') || '#a0b9e6';

    // Set styles for the landing page
    landingPage.className = 'landing-page'; // Use a class for styling

    const title = document.createElement('h1');
    title.textContent = storedTitleText;
    title.style.color = storedTitleColor; // Use stored color
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Store title text and color when page is unloaded
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('titleText', title.textContent);
        localStorage.setItem('titleColor', title.style.color);
    });

    // Create buttons
    const buttons = [
        { text: 'Wallet', onClick: walletUI },
        { text: 'Mint', onClick: mintSelectionUI },
        { text: 'Messaging Coming Soon', onClick: () => { /* Add functionality here */ } },
        { text: 'User', onClick: userUI }
    ];

    buttons.forEach(({ text, onClick }) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'styled-button'; // Use a class for styling
        button.addEventListener('click', onClick);
        landingPage.appendChild(button);
    });
}
