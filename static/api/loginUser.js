// static/api/loginUser.js

import { landingPageUI } from '../ui/landingPageUI.js';

export function loginUser(username, password, keepMeLoggedIn) {
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
            if (keepMeLoggedIn) {
                // Store login state in local storage or cookies
                localStorage.setItem('isLoggedIn', 'true');
            } else {
                // Clear any existing login state
                localStorage.removeItem('isLoggedIn');
            }
            landingPageUI(); // Navigate to mint selection UI
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Check login state on page load
export function checkLoginState() {
    return localStorage.getItem('isLoggedIn') === 'true';
}
