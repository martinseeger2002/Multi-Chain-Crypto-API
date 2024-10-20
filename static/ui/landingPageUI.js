import { walletUI } from './walletUI.js';
import { mintSelectionUI } from './mintSelectionUI.js';

export function landingPageUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Retrieve stored styles and text
    const storedTitleText = localStorage.getItem('titleText') || 'Welcome to Blockchain Plugz';
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
    walletButton.style.backgroundColor = '#1c1c1c';
    walletButton.style.color = '#a0b9e6';
    walletButton.style.border = 'none';
    walletButton.style.padding = '15px 30px';
    walletButton.style.margin = '10px 0';
    walletButton.style.cursor = 'pointer';
    walletButton.style.fontSize = '18px';
    walletButton.style.borderRadius = '5px';
    walletButton.style.width = '150px';
    walletButton.addEventListener('click', () => {
        walletUI();
    });
    landingPage.appendChild(walletButton);

    // Mint button
    const mintButton = document.createElement('button');
    mintButton.textContent = 'Mint';
    mintButton.style.backgroundColor = '#1c1c1c';
    mintButton.style.color = '#a0b9e6';
    mintButton.style.border = 'none';
    mintButton.style.padding = '15px 30px';
    mintButton.style.margin = '10px 0';
    mintButton.style.cursor = 'pointer';
    mintButton.style.fontSize = '18px';
    mintButton.style.borderRadius = '5px';
    mintButton.style.width = '150px';
    mintButton.addEventListener('click', () => {
        mintSelectionUI();
    });
    landingPage.appendChild(mintButton);
}
