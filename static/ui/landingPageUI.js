import { walletUI } from './walletUI.js';
import { mintSelectionUI } from './mintSelectionUI.js';
import { userUI } from './userUI.js'; // Import the userUI function

export function landingPageUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Retrieve stored styles and text
    const storedTitleText = localStorage.getItem('titleText') || 'Welcome to Blockchain Plugz Multi-Chain Wallet';
    const storedTitleColor = localStorage.getItem('titleColor') || '#a0b9e6';
    const storedButtonStyles = JSON.parse(localStorage.getItem('buttonStyles')) || {
        backgroundColor: '#1c1c1c',
        color: '#a0b9e6',
        padding: '15px 30px',
        fontSize: '18px',
        width: '150px'
    };

    // Set styles for the landing page
    landingPage.style.display = 'flex';
    landingPage.style.flexDirection = 'column';
    landingPage.style.justifyContent = 'center';
    landingPage.style.alignItems = 'center';
    landingPage.style.height = '100vh';
    landingPage.style.backgroundColor = '#121212';
    landingPage.style.color = '#a0b9e6';
    landingPage.style.margin = '0';
    landingPage.style.textAlign = 'center'; // Ensure text is centered

    const title = document.createElement('h1');
    title.textContent = storedTitleText;
    title.style.color = storedTitleColor; // Use stored color
    title.style.marginBottom = '20px';
    title.style.fontSize = '24px';
    landingPage.appendChild(title);

    // Store title text and color when page is unloaded
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('titleText', title.textContent);
        localStorage.setItem('titleColor', title.style.color);
        localStorage.setItem('buttonStyles', JSON.stringify({
            backgroundColor: walletButton.style.backgroundColor,
            color: walletButton.style.color,
            padding: walletButton.style.padding,
            fontSize: walletButton.style.fontSize,
            width: walletButton.style.width
        }));
    });

    // Wallet button
    const walletButton = document.createElement('button');
    walletButton.textContent = 'Wallet';
    walletButton.style.backgroundColor = storedButtonStyles.backgroundColor;
    walletButton.style.color = storedButtonStyles.color;
    walletButton.style.border = 'none';
    walletButton.style.padding = storedButtonStyles.padding;
    walletButton.style.margin = '10px 0';
    walletButton.style.cursor = 'pointer';
    walletButton.style.fontSize = storedButtonStyles.fontSize;
    walletButton.style.borderRadius = '5px';
    walletButton.style.width = storedButtonStyles.width;
    walletButton.addEventListener('click', () => {
        walletUI(); // Navigate to the wallet UI
    });
    landingPage.appendChild(walletButton);

    // Mint button
    const mintButton = document.createElement('button');
    mintButton.textContent = 'Mint';
    mintButton.style.backgroundColor = storedButtonStyles.backgroundColor;
    mintButton.style.color = storedButtonStyles.color;
    mintButton.style.border = 'none';
    mintButton.style.padding = storedButtonStyles.padding;
    mintButton.style.margin = '10px 0';
    mintButton.style.cursor = 'pointer';
    mintButton.style.fontSize = storedButtonStyles.fontSize;
    mintButton.style.borderRadius = '5px';
    mintButton.style.width = storedButtonStyles.width;
    mintButton.addEventListener('click', () => {
        mintSelectionUI();
    });
    landingPage.appendChild(mintButton);

    // Play to Earn button
    const playToEarnButton = document.createElement('button');
    playToEarnButton.textContent = 'Play to Earn';
    playToEarnButton.style.backgroundColor = storedButtonStyles.backgroundColor;
    playToEarnButton.style.color = storedButtonStyles.color;
    playToEarnButton.style.border = 'none';
    playToEarnButton.style.padding = storedButtonStyles.padding;
    playToEarnButton.style.margin = '10px 0';
    playToEarnButton.style.cursor = 'pointer';
    playToEarnButton.style.fontSize = storedButtonStyles.fontSize;
    playToEarnButton.style.borderRadius = '5px';
    playToEarnButton.style.width = storedButtonStyles.width;
    playToEarnButton.addEventListener('click', () => {
        // Add functionality for Play to Earn button here
    });
    landingPage.appendChild(playToEarnButton);

    // User button
    const userButton = document.createElement('button');
    userButton.textContent = 'User';
    userButton.style.backgroundColor = storedButtonStyles.backgroundColor;
    userButton.style.color = storedButtonStyles.color;
    userButton.style.border = 'none';
    userButton.style.padding = storedButtonStyles.padding;
    userButton.style.margin = '10px 0';
    userButton.style.cursor = 'pointer';
    userButton.style.fontSize = storedButtonStyles.fontSize;
    userButton.style.borderRadius = '5px';
    userButton.style.width = storedButtonStyles.width;
    userButton.addEventListener('click', () => {
        userUI(); // Navigate to the user UI
    });
    landingPage.appendChild(userButton);
}
