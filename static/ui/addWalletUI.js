import { walletUI } from './walletUI.js';


export function addWalletUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Add Wallet';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Create form elements
    const form = document.createElement('form');
    form.id = 'wallet-form';
    form.className = 'wallet-form'; // Use a class for styling

    const dropdown = document.createElement('select');
    dropdown.className = 'styled-select'; // Use a class for styling

    const tickers = ['DOGE', 'LTC', 'LKY'];
    tickers.forEach(ticker => {
        const option = document.createElement('option');
        option.value = ticker;
        option.textContent = ticker;
        dropdown.appendChild(option);
    });

    const getNewAddressButton = document.createElement('button');
    getNewAddressButton.className = 'styled-button'; // Use a class for styling
    getNewAddressButton.textContent = 'Get New Address';
    getNewAddressButton.addEventListener('click', () => handleButtonClick('get_new_address_and_privkey'));

    const custodialText = document.createElement('div');
    custodialText.textContent = '"Get New Address" creates a Custodial wallet: we have your key but you do not have to wait to use it.';
    custodialText.className = 'info-text red-text'; // Use classes for styling

    // Commenting out the "Generate New Address" button and its text
    /*
    const generateKeyButton = document.createElement('button');
    generateKeyButton.className = 'styled-button'; // Use a class for styling
    generateKeyButton.textContent = 'Generate New Address';
    generateKeyButton.addEventListener('click', () => handleButtonClick('generate_key'));

    const selfCustodialText = document.createElement('div');
    selfCustodialText.textContent = '"Generate New Address" creates a Self-Custodial wallet: your keys are only on your device';
    selfCustodialText.className = 'info-text green-text'; // Use classes for styling
    */

    const waitText = document.createElement('div');
    waitText.textContent = 'If using self-custodial wallet, please wait up to 24 hours for the balance and UTXOs to be scanned.';
    waitText.className = 'info-text green-text'; // Use classes for styling

    const labelInput = document.createElement('input');
    labelInput.className = 'styled-input'; // Use a class for styling
    labelInput.type = 'text';
    labelInput.placeholder = 'Wallet Label';
    labelInput.required = true;

    const addressInput = document.createElement('input');
    addressInput.className = 'styled-input'; // Use a class for styling
    addressInput.type = 'text';
    addressInput.placeholder = 'Address';
    addressInput.required = true;

    const wifPrivkeyInput = document.createElement('input');
    wifPrivkeyInput.className = 'styled-input'; // Use a class for styling
    wifPrivkeyInput.type = 'text';
    wifPrivkeyInput.placeholder = 'WIF Private Key';
    wifPrivkeyInput.required = true;

    const importText = document.createElement('div');
    importText.textContent = 'If importing key, it is self-custodial';
    importText.className = 'info-text green-text'; // Use classes for styling

    const saveButton = document.createElement('button');
    saveButton.className = 'styled-button'; // Use a class for styling
    saveButton.textContent = 'Save Wallet';

    const backButton = document.createElement('button');
    backButton.className = 'styled-button'; // Use a class for styling
    backButton.textContent = 'Back';
    backButton.addEventListener('click', walletUI);

    // Commenting out the addition of the button and text to the form
    /*
    form.appendChild(generateKeyButton);
    form.appendChild(selfCustodialText);
    */

    // Continue with the rest of the form elements
    form.appendChild(dropdown);
    form.appendChild(getNewAddressButton);
    form.appendChild(custodialText);
    form.appendChild(waitText);
    form.appendChild(labelInput);
    form.appendChild(addressInput);
    form.appendChild(wifPrivkeyInput);
    form.appendChild(importText);
    form.appendChild(saveButton);

    // Append form and back button to landing page
    landingPage.appendChild(form);
    landingPage.appendChild(backButton);

    // Event listener to save wallet
    saveButton.addEventListener('click', () => {
        const label = labelInput.value.trim();
        const address = addressInput.value.trim();
        const wifPrivkey = wifPrivkeyInput.value.trim();
        const ticker = dropdown.value;

        if (label && address && wifPrivkey) {
            const wallet = {
                label,
                ticker,
                address,
                privkey: wifPrivkey,
                utxos: [] // Initialize with an empty UTXO list
            };

            // Retrieve existing wallets from local storage
            const wallets = JSON.parse(localStorage.getItem('wallets')) || [];

            // Add new wallet
            wallets.push(wallet);

            // Save updated wallets back to local storage
            localStorage.setItem('wallets', JSON.stringify(wallets));

            // Clear form inputs
            form.reset();

            alert('Wallet saved successfully!');

            // Navigate back to the previous screen and select the new wallet
            walletUI(wallet.label);
        } else {
            alert('Please fill in all fields correctly.');
        }
    });

    function handleButtonClick(endpoint) {
        const ticker = dropdown.value;
        disableButtons(true);

        fetch(`/api/v1/${endpoint}/${ticker}`, {
            headers: {
                'X-API-Key': apiKey // Use the apiKey variable
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Full API Response:', data); // Log the full response
            if (data && data.data) {
                console.log('Data Object:', data.data); // Log the data object
                const { new_address, privkey } = data.data; // Use new_address
                addressInput.value = new_address || ''; // Set the address input
                wifPrivkeyInput.value = privkey || ''; // Set the private key input
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching data.');
        })
        .finally(() => {
            disableButtons(false);
        });
    }

    function disableButtons(disable) {
        getNewAddressButton.disabled = disable;
        getNewAddressButton.textContent = disable ? 'Creating Wallet...' : 'Get New Address';
        getNewAddressButton.style.backgroundColor = disable ? '#555' : '#333';
    }
}
