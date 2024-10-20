import { landingPageUI } from './landingPageUI.js';

export function userUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Apply styles to the landing page
    landingPage.style.padding = '20px';
    landingPage.style.fontFamily = 'Courier New, monospace'; // Use a monospace font for a techy look
    landingPage.style.backgroundColor = '#1a1a1a'; // Dark background

    const title = document.createElement('h1');
    title.textContent = 'User Interface';
    landingPage.appendChild(title);

    // Style the title
    title.style.color = '#00bfff'; // Bright blue for a techy feel
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';

    // Create form elements
    const form = document.createElement('form');
    const passwordInput = createInputField('Password', 'password');
    const dogeInput = createInputField('DOGE Address', 'doge');
    const ltcInput = createInputField('LTC Address', 'ltc');
    const lkyInput = createInputField('LKY Address', 'lky');
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Update Credentials';
    submitButton.type = 'submit';

    // Style the submit button
    styleButton(submitButton);

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
    backButton.addEventListener('click', landingPageUI);

    // Style the back button
    styleButton(backButton);

    landingPage.appendChild(backButton);

    // Fetch user data and populate fields
    fetchUserData();

    function createInputField(labelText, name) {
        const container = document.createElement('div');
        const label = document.createElement('label');
        const input = document.createElement('input');

        label.textContent = labelText;
        label.style.color = '#00bfff'; // Blue text
        label.style.display = 'block';
        label.style.marginTop = '10px';

        input.name = name;
        input.style.width = '100%';
        input.style.padding = '10px';
        input.style.marginTop = '5px';
        input.style.border = '1px solid #333';
        input.style.borderRadius = '5px';
        input.style.backgroundColor = '#1a1a1a';
        input.style.color = '#00bfff';

        container.appendChild(label);
        container.appendChild(input);
        return container;
    }

    function styleButton(button) {
        button.style.width = '100%';
        button.style.padding = '10px';
        button.style.marginTop = '10px';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.backgroundColor = '#333'; // Dark button background
        button.style.color = '#00bfff'; // Blue text
        button.style.cursor = 'pointer';
        button.style.transition = 'background-color 0.3s';

        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#444'; // Slightly lighter on hover
        });

        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#333';
        });
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
