import { walletUI } from './walletUI.js';
import { mintSelectionUI } from './mintSelectionUI.js';

export function landingPageUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Welcome to Plugz';
    landingPage.appendChild(title);

    // Wallet button
    const walletButton = document.createElement('button');
    walletButton.textContent = 'Wallet';
    walletButton.addEventListener('click', () => {
        walletUI();
    });
    landingPage.appendChild(walletButton);

    // Mint button
    const mintButton = document.createElement('button');
    mintButton.textContent = 'Mint';
    mintButton.addEventListener('click', () => {
        mintSelectionUI();
    });
    landingPage.appendChild(mintButton);
}
