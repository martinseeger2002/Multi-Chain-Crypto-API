import { loginUI } from './loginUI.js';

export function mainSplashUI() {
    // Apply consistent styles to the body
    document.body.style.display = 'flex';
    document.body.style.flexDirection = 'column';
    document.body.style.alignItems = 'center';
    document.body.style.justifyContent = 'center';
    document.body.style.height = '100vh';
    document.body.style.margin = '0'; // Remove default margin

    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Apply consistent styles
    landingPage.style.display = 'flex';
    landingPage.style.flexDirection = 'column';
    landingPage.style.alignItems = 'center';
    landingPage.style.justifyContent = 'center';
    landingPage.style.height = '100vh';
    landingPage.style.backgroundColor = 'transparent'; // Make background transparent
    landingPage.style.width = '100%';
    landingPage.style.backgroundImage = 'url("/static/images/MAINBKGD.webp")'; // Set the background image
    landingPage.style.backgroundSize = 'cover'; // Ensure the image covers the entire element
    landingPage.style.backgroundPosition = 'center'; // Center the image
    landingPage.style.backgroundRepeat = 'no-repeat'; // Prevent the image from repeating

    // Welcome message
    const welcomeMessage = document.createElement('h1');
    welcomeMessage.textContent = 'Welcome to Blockchain Plugz Multi-Chain Wallet';
    welcomeMessage.style.fontFamily = '"Courier New", monospace'; // Cypherpunk style font
    welcomeMessage.style.color = '#ffffff'; // White text
    welcomeMessage.style.textShadow = '2px 2px 4px #000000'; // Text shadow for effect
    welcomeMessage.style.textAlign = 'center'; // Center text
    welcomeMessage.style.animation = 'pulse 3s infinite'; // Add pulse animation
    landingPage.appendChild(welcomeMessage);

    // Cool description
    const coolDescription = document.createElement('p');
    coolDescription.textContent = 'Empower your digital legacy with our multi-chain wallet, offering seamless custodial and self-custodial options for secure blockchain inscriptions!';
    coolDescription.style.fontFamily = '"Courier New", monospace'; // Cypherpunk style font
    coolDescription.style.color = '#ffffff'; // White text for better visibility
    coolDescription.style.textAlign = 'center'; // Center text
    coolDescription.style.fontSize = '14px'; // Larger text for better visibility
    coolDescription.style.marginTop = '10px'; // Adjusted margin for spacing
    landingPage.appendChild(coolDescription);

    // Enter button
    const enterButton = document.createElement('button');
    enterButton.textContent = 'Enter';
    enterButton.style.margin = '20px 0';
    enterButton.style.padding = '10px 20px';
    enterButton.style.fontSize = '16px';
    enterButton.style.borderRadius = '5px';
    enterButton.style.border = 'none';
    enterButton.style.backgroundColor = '#444444'; // Slightly lighter dark button
    enterButton.style.color = '#ffffff'; // White text
    enterButton.style.cursor = 'pointer';
    enterButton.style.fontFamily = '"Courier New", monospace'; // Cypherpunk style font
    enterButton.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)'; // Cyan hue shadow
    enterButton.addEventListener('click', () => {
        loginUI(); // Navigate to the login screen
    });
    landingPage.appendChild(enterButton);

    // Add keyframes for pulse animation
    const styleSheet = document.styleSheets[0];
    styleSheet.insertRule(`
        @keyframes pulse {
            0% { color: #ffffff; }
            50% { color: #00ffff; }
            100% { color: #ffffff; }
        }
    `, styleSheet.cssRules.length);
}
