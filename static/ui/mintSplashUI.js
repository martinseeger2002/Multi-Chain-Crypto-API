import { loginUser } from '../api/loginUser.js';

export function mintSplashUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Mint'; // Updated label
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

    const loginButton = document.createElement('button');
    loginButton.type = 'button';
    loginButton.textContent = 'Log In';
    loginButton.style.width = '100%';
    loginButton.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (username && password) {
            loginUser(username, password);
        } else {
            alert('Please enter both username and password.');
        }
    });

    form.appendChild(usernameInput);
    form.appendChild(passwordInput);
    form.appendChild(loginButton);
    landingPage.appendChild(form);
}
