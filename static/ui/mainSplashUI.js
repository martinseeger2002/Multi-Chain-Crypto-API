import { loginUI } from './loginUI.js';

export function mainSplashUI() {
    // Apply consistent styles to the body
    document.body.className = 'splash-body'; // Use a class for styling

    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Apply consistent styles
    landingPage.className = 'splash-landing-page'; // Use a class for styling

    // Welcome message
    const welcomeMessage = document.createElement('h1');
    welcomeMessage.textContent = 'Welcome to Blockchain Plugz Multi-Chain Wallet';
    welcomeMessage.className = 'splash-welcome-message'; // Use a class for styling
    landingPage.appendChild(welcomeMessage);

    // Cool description
    const coolDescription = document.createElement('p');
    coolDescription.textContent = 'Empower your digital legacy with our multi-chain wallet, offering seamless custodial and self-custodial options for secure blockchain inscriptions!';
    coolDescription.className = 'splash-cool-description'; // Use a class for styling
    landingPage.appendChild(coolDescription);

    // Enter button
    const enterButton = document.createElement('button');
    enterButton.textContent = 'Enter';
    enterButton.className = 'splash-enter-button'; // Use a class for styling
    enterButton.addEventListener('click', () => {
        loginUI(); // Navigate to the login screen
    });
    landingPage.appendChild(enterButton);
}
