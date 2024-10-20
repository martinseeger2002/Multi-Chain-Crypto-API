import { loginUI } from './loginUI.js';

export function mainSplashUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Welcome message
    const welcomeMessage = document.createElement('h1');
    welcomeMessage.textContent = 'Welcome to Blockchain Plugz';
    landingPage.appendChild(welcomeMessage);

    // Enter button
    const enterButton = document.createElement('button');
    enterButton.textContent = 'Enter';
    enterButton.style.margin = '20px 0';
    enterButton.addEventListener('click', () => {
        loginUI(); // Navigate to the login screen
    });
    landingPage.appendChild(enterButton);
}