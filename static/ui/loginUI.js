import { loginUser, checkLoginState } from '../api/loginUser.js';
import { landingPageUI } from './landingPageUI.js';

export function loginUI() {
    if (checkLoginState()) {
        landingPageUI(); // Redirect to the landing page if already logged in
        return;
    }

    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Login';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Create login form
    const form = document.createElement('form');
    form.className = 'login-form'; // Use a class for styling

    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.placeholder = 'Username';
    usernameInput.required = true;
    usernameInput.className = 'styled-input'; // Use a class for styling

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Password';
    passwordInput.required = true;
    passwordInput.className = 'styled-input'; // Use a class for styling

    // Create container for login button and checkbox
    const actionContainer = document.createElement('div');
    actionContainer.className = 'action-container'; // Use a class for styling

    const loginButton = document.createElement('button');
    loginButton.type = 'button';
    loginButton.textContent = 'Log In';
    loginButton.className = 'styled-button'; // Use a class for styling
    loginButton.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const keepMeLoggedIn = document.getElementById('keepMeLoggedIn').checked;

        if (username && password) {
            loginUser(username, password, keepMeLoggedIn)
                .then(() => {
                    // Redirect to landingPageUI on successful login
                    landingPageUI();
                })
                .catch(() => {
                    alert('Login failed. Please try again.');
                });
        } else {
            alert('Please enter both username and password.');
        }
    });

    // Add a toggle button for "Keep me logged in"
    const keepMeLoggedInContainer = document.createElement('div');
    keepMeLoggedInContainer.className = 'keep-logged-in-container'; // Use a class for styling

    const keepMeLoggedInCheckbox = document.createElement('input');
    keepMeLoggedInCheckbox.type = 'checkbox';
    keepMeLoggedInCheckbox.id = 'keepMeLoggedIn';

    const keepMeLoggedInLabel = document.createElement('label');
    keepMeLoggedInLabel.htmlFor = 'keepMeLoggedIn';
    keepMeLoggedInLabel.innerText = 'Keep me logged in';

    keepMeLoggedInContainer.appendChild(keepMeLoggedInCheckbox);
    keepMeLoggedInContainer.appendChild(keepMeLoggedInLabel);

    actionContainer.appendChild(loginButton);
    actionContainer.appendChild(keepMeLoggedInContainer);

    form.appendChild(usernameInput);
    form.appendChild(passwordInput);
    form.appendChild(actionContainer);
    landingPage.appendChild(form);
}
