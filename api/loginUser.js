import { landingPageUI } from '../static/ui/landingPageUI.js';

export function loginUser(username, password) {
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            landingPageUI(); // Navigate to landing page UI
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}
