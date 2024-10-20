// static/api/loginUser.js

import { landingPageUI } from '../ui/landingPageUI.js';

export function loginUser(username, password) {
    return fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            landingPageUI(); // Navigate to mint selection UI
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}
