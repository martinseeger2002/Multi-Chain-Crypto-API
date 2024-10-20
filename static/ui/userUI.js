import { landingPageUI } from './landingPageUI.js';

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
    const passwordInput = createInputField('Password', 'password');
    const dogeInput = createInputField('DOGE Address', 'doge');
    const ltcInput = createInputField('LTC Address', 'ltc');
    const lkyInput = createInputField('LKY Address', 'lky');
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Update Credentials';
    submitButton.type = 'submit';
    submitButton.className = 'styled-button'; // Use a class for styling

    form.appendChild(passwordInput);
    form.appendChild(dogeInput);
    form.appendChild(ltcInput);
    form.appendChild(lkyInput);
    form.appendChild(submitButton);

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        updateUserCredentials();
    });

    landingPage.appendChild(form);

    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button back-button'; // Use a class for styling
    backButton.addEventListener('click', landingPageUI);

    landingPage.appendChild(backButton);

    // Fetch user data and populate fields
    fetchUserData();

    function createInputField(labelText, name) {
        const container = document.createElement('div');
        container.className = 'input-container'; // Use a class for styling

        const label = document.createElement('label');
        label.textContent = labelText;
        label.className = 'input-label'; // Use a class for styling

        const input = document.createElement('input');
        input.name = name;
        input.className = 'styled-input'; // Use a class for styling

        container.appendChild(label);
        container.appendChild(input);
        return container;
    }

    function fetchUserData() {
        const apiUrl = 'https://blockchainplugz.com/api/users';
        console.log('Fetching user data from:', apiUrl);

        fetch(apiUrl, {
            headers: {
                'X-API-Key': apiKey // Ensure you have the API key available
            }
        })
        .then(response => {
            console.log('Response status:', response.status);
            return response.text(); // Get the response as text
        })
        .then(text => {
            console.log('Response text:', text); // Log the raw response text
            try {
                const users = JSON.parse(text); // Attempt to parse the text as JSON
                console.log('Fetched users:', users); // Print the entire response
                const user = users.find(u => u.user === 'exampleUser'); // Replace with actual user logic
                if (user) {
                    dogeInput.querySelector('input').value = user.doge || '';
                    ltcInput.querySelector('input').value = user.ltc || '';
                    lkyInput.querySelector('input').value = user.lky || '';
                }
            } catch (e) {
                console.error('Error parsing JSON:', e);
                alert('An error occurred while processing user data.');
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            alert('An error occurred while fetching user data.');
        });
    }

    function updateUserCredentials() {
        const user = 'exampleUser'; // Replace with actual user identifier
        const apiUrl = `https://blockchainplugz.com/api/users/${user}/update_credentials`;

        const data = {
            password: form.password.value,
            doge: form.doge.value,
            ltc: form.ltc.value,
            lky: form.lky.value
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
}