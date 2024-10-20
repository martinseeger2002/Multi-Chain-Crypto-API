// static/api/loginUser.js

import { mintSelectionUI } from '../ui/mintSelectionUI.js';

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
            mintSelectionUI(); // Navigate to mint selection UI
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}