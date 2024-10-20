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
    title.style.color = 'white'; // Ensure title is visible
    landingPage.appendChild(title);

    // Create login form
    const form = document.createElement('form');
    form.style.maxWidth = '300px';
    form.style.margin = '0 auto';

    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.placeholder = 'Username';
    usernameInput.required = true;
    usernameInput.style.width = '100%';
    usernameInput.style.margin = '10px 0';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Password';
    passwordInput.required = true;
    passwordInput.style.width = '100%';
    passwordInput.style.margin = '10px 0';

    // Create container for login button and checkbox
    const actionContainer = document.createElement('div');
    actionContainer.style.display = 'flex';
    actionContainer.style.flexDirection = 'column';
    actionContainer.style.alignItems = 'center';
    actionContainer.style.margin = '10px 0';

    const loginButton = document.createElement('button');
    loginButton.type = 'button';
    loginButton.textContent = 'Log In';
    loginButton.style.width = '100%';
    loginButton.style.marginBottom = '10px';
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
    keepMeLoggedInContainer.style.display = 'flex';
    keepMeLoggedInContainer.style.alignItems = 'center';
    keepMeLoggedInContainer.style.color = 'white';
    keepMeLoggedInContainer.style.marginTop = '10px'; // Add margin for visibility

    const keepMeLoggedInCheckbox = document.createElement('input');
    keepMeLoggedInCheckbox.type = 'checkbox';
    keepMeLoggedInCheckbox.id = 'keepMeLoggedIn';
    keepMeLoggedInCheckbox.style.marginRight = '5px';

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
