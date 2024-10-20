export function mintFileUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Mint File';
    landingPage.appendChild(title);

    // Display mint credits
    const creditsDisplay = document.createElement('div');
    creditsDisplay.style.margin = '10px 0';
    landingPage.appendChild(creditsDisplay);

    fetch('/api/v1/mint_credits')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                creditsDisplay.textContent = `Mint Credits: ${data.credits}`;
            } else {
                creditsDisplay.textContent = 'Error fetching mint credits';
            }
        })
        .catch(error => {
            console.error('Error fetching mint credits:', error);
            creditsDisplay.textContent = 'Error fetching mint credits';
        });

    // Wallet dropdown
    const walletDropdown = document.createElement('select');
    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
    wallets.forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.label;
        option.textContent = wallet.label;
        walletDropdown.appendChild(option);
    });
    landingPage.appendChild(walletDropdown);

    // UTXO dropdown
    const utxoDropdown = document.createElement('select');
    landingPage.appendChild(utxoDropdown);

    walletDropdown.addEventListener('change', () => {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        if (selectedWallet && selectedWallet.utxos) {
            utxoDropdown.innerHTML = ''; // Clear existing options
            selectedWallet.utxos.forEach(utxo => {
                const option = document.createElement('option');
                option.value = utxo.txid;
                option.textContent = `TXID: ${utxo.txid}, Value: ${utxo.value}`;
                utxoDropdown.appendChild(option);
            });
        }
    });

    // File selection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'file-input';
    fileInput.style.display = 'none'; // Hide the default file input

    const fileLabel = document.createElement('label');
    fileLabel.htmlFor = 'file-input';
    fileLabel.textContent = 'Choose File';
    fileLabel.className = 'styled-button'; // Use the same class as other buttons

    fileInput.addEventListener('change', handleFileSelect);
    landingPage.appendChild(fileInput);
    landingPage.appendChild(fileLabel);

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.size <= 100 * 1024) { // 100 KB
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64 = e.target.result.split(',')[1];
                const hex = base64ToHex(base64);
                const mimeType = file.type;
                localStorage.setItem('fileToMint', JSON.stringify({ mimeType, hex }));
                console.log('File saved to local storage:', { mimeType, hex });
            };
            reader.readAsDataURL(file);
        } else {
            alert('File must be under 100 KB.');
        }
    }

    function base64ToHex(base64) {
        const raw = atob(base64);
        let result = '';
        for (let i = 0; i < raw.length; i++) {
            const hex = raw.charCodeAt(i).toString(16);
            result += (hex.length === 2 ? hex : '0' + hex);
        }
        return result.toUpperCase();
    }
}
