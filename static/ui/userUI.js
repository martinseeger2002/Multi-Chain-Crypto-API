import { landingPageUI } from './landingPageUI.js';
import { loginUI } from './loginUI.js'; // Import loginUI to redirect after logout

export function userUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Apply styles to the landing page
    landingPage.className = 'user-landing-page'; // Use a class for styling

    const title = document.createElement('h1');
    title.textContent = 'User Interface';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Create form elements
    const form = document.createElement('form');
    const dogeButton = createButton('DOGE Address', 'doge');
    const ltcButton = createButton('LTC Address', 'ltc');
    const lkyButton = createButton('LKY Address', 'lky');
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Update Credentials';
    submitButton.type = 'submit';
    submitButton.className = 'styled-button'; // Use a class for styling

    form.appendChild(dogeButton);
    form.appendChild(ltcButton);
    form.appendChild(lkyButton);
    form.appendChild(submitButton);

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        updateUserCredentials();
    });

    landingPage.appendChild(form);


        // **New Code: Clear Pending Transactions Button**
        const clearPendingButton = document.createElement('button');
        clearPendingButton.textContent = 'Clear Pending';
        clearPendingButton.className = 'styled-button'; // Use a class for styling
        clearPendingButton.addEventListener('click', () => {
            localStorage.removeItem('mintResponse'); // Clear pending transactions from local storage
            localStorage.removeItem('pendingUTXOs'); // Clear pending UTXOs from local storage
        alert('Pending transactions and UTXOs cleared.');
        });
    landingPage.appendChild(clearPendingButton);

    // Create Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button back-button'; // Use a class for styling
    backButton.addEventListener('click', landingPageUI);

    landingPage.appendChild(backButton);

    // Create Logout button
    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Logout';
    logoutButton.className = 'styled-button logout-button'; // Use a class for styling
    logoutButton.addEventListener('click', handleLogout);

    landingPage.appendChild(logoutButton);

    // Fetch user data and populate fields
    fetchUserData();

    function createButton(labelText, name) {
        const container = document.createElement('div');
        container.className = 'input-container'; // Use a class for styling

        const label = document.createElement('label');
        label.textContent = labelText;
        label.className = 'coin-label'; // Use a class for styling

        const button = document.createElement('button');
        button.textContent = labelText;
        button.name = name;
        button.className = 'styled-button'; // Use a class for styling

        container.appendChild(label);
        container.appendChild(button);
        return container;
    }

    function fetchUserData() {
        const tickers = ['doge', 'ltc', 'lky'];
        tickers.forEach(ticker => {
            const apiUrl = `/api/v1/wallet/${ticker}`;
            console.log(`Fetching ${ticker.toUpperCase()} address from:`, apiUrl);

            fetch(apiUrl, {
                headers: {
                    'X-API-Key': apiKey // Ensure you have the API key available
                }
            })
            .then(response => {
                console.log(`Response status for ${ticker}:`, response.status);
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    const button = form.querySelector(`button[name="${ticker}"]`);
                    const address = data.address || '';
                    const formattedAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
                    button.textContent = formattedAddress;
                } else {
                    console.error(`Error fetching ${ticker} address:`, data.message);
                }
            })
            .catch(error => {
                console.error(`Error fetching ${ticker} address:`, error);
                alert(`An error occurred while fetching ${ticker.toUpperCase()} address.`);
            });
        });
    }

    function updateUserCredentials() {
        const user = 'exampleUser'; // Replace with actual user identifier
        const apiUrl = `https://blockchainplugz.com/api/users/${user}/update_credentials`;

        const data = {
            doge: form.querySelector('button[name="doge"]').textContent,
            ltc: form.querySelector('button[name="ltc"]').textContent,
            lky: form.querySelector('button[name="lky"]').textContent
        };

        console.log('Updating user credentials with data:', data);

        fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey // Ensure you have the API key available
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Update response:', data);
            if (data.message) {
                alert(data.message);
            } else if (data.error) {
                alert(data.error);
            }
        })
        .catch(error => {
            console.error('Error updating credentials:', error);
            alert('An error occurred while updating credentials.');
        });
    }

    function handleLogout() {
        // Remove login state from localStorage
        localStorage.removeItem('isLoggedIn');
        console.log('User has been logged out.');

        // Redirect to login UI
        loginUI();
    }
}
