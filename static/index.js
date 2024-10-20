import { landingPageUI } from './ui/landingPageUI.js';
import { mintSplashUI } from './ui/mintSplashUI.js';
import { mintSelectionUI } from './ui/mintSelectionUI.js';
import { walletUI } from './ui/walletUI.js';
import { addWalletUI } from './ui/addWalletUI.js';
import { viewUtxoUI } from './ui/viewUtxoUI.js';
import { manageWalletsUI } from './ui/manageWalletsUI.js';
import { sendTxUI } from './ui/sendTxUI.js';
import { confirmSendTxUI } from './ui/confirmSendTxUI.js';
import { mintFileUI } from './ui/mintFileUI.js';
import { loginUser } from './api/loginUser.js';

document.addEventListener('DOMContentLoaded', () => {
    landingPageUI();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./static/minter-service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}
