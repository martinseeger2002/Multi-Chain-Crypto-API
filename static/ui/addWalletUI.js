import { walletUI } from './walletUI.js';


export function addWalletUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const title = document.createElement('h1');
    title.textContent = 'Add Wallet';
    title.style.color = '#00bcd4'; // Blue hue
    title.style.textAlign = 'center';
    title.style.margin = '10px 0'; // Adjust top and bottom margin
    landingPage.appendChild(title);

    // Create form elements
    const form = document.createElement('form');
    form.id = 'wallet-form';
    form.style.maxWidth = '280px'; // Reduce width slightly
    form.style.margin = '0 auto'; // Center form
    form.style.backgroundColor = '#1a1a1a'; // Dark background
    form.style.padding = '15px'; // Reduce padding
    form.style.borderRadius = '8px';
    form.style.boxShadow = '0 0 10px rgba(0, 188, 212, 0.5)'; // Blue shadow

    const dropdown = document.createElement('select');
    dropdown.style.width = '100%';
    dropdown.style.marginBottom = '10px';
    dropdown.style.padding = '10px';
    dropdown.style.backgroundColor = '#333';
    dropdown.style.color = '#00bcd4'; // Blue hue
    dropdown.style.border = 'none';
    dropdown.style.borderRadius = '4px';

    const tickers = ['DOGE', 'LTC', 'LKY'];
    tickers.forEach(ticker => {
        const option = document.createElement('option');
        option.value = ticker;
        option.textContent = ticker;
        dropdown.appendChild(option);
    });

    const buttonStyle = {
        width: '100%',
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: '#333',
        color: '#00bcd4', // Blue hue
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
    };

    const getNewAddressButton = document.createElement('button');
    Object.assign(getNewAddressButton.style, buttonStyle);
    getNewAddressButton.textContent = 'Get New Address';
    getNewAddressButton.addEventListener('click', () => handleButtonClick('get_new_address_and_privkey'));

    const custodialText = document.createElement('div');
    custodialText.textContent = '"Get New Address" creates a Custodial wallet: we have your key but you do not have to wait to use it.';
    custodialText.style.color = '#ff5252'; // Red hue
    custodialText.style.fontSize = '12px'; // Smaller text
    custodialText.style.marginBottom = '10px';

    const generateKeyButton = document.createElement('button');
    Object.assign(generateKeyButton.style, buttonStyle);
    generateKeyButton.textContent = 'Generate New Address';
    generateKeyButton.addEventListener('click', () => handleButtonClick('generate_key'));

    const selfCustodialText = document.createElement('div');
    selfCustodialText.textContent = '"Generate New Address" creates a Self-Custodial wallet: your keys are only on your device';
    selfCustodialText.style.color = '#4caf50'; // Green hue
    selfCustodialText.style.fontSize = '12px'; // Smaller text
    selfCustodialText.style.marginBottom = '10px';

    const waitText = document.createElement('div');
    waitText.textContent = 'If using self-custodial wallet, please wait up to 24 hours for the balance and UTXOs to be scanned.';
    waitText.style.color = '#4caf50'; // Green hue
    waitText.style.fontSize = '12px'; // Smaller text
    waitText.style.marginBottom = '10px';

    const inputStyle = {
        width: '100%',
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: '#333',
        color: '#00bcd4', // Blue hue
        border: 'none',
        borderRadius: '4px'
    };

    const labelInput = document.createElement('input');
    Object.assign(labelInput.style, inputStyle);
    labelInput.type = 'text';
    labelInput.placeholder = 'Wallet Label';
    labelInput.required = true;

    const addressInput = document.createElement('input');
    Object.assign(addressInput.style, inputStyle);
    addressInput.type = 'text';
    addressInput.placeholder = 'Address';
    addressInput.required = true;

    const wifPrivkeyInput = document.createElement('input');
    Object.assign(wifPrivkeyInput.style, inputStyle);
    wifPrivkeyInput.type = 'text';
    wifPrivkeyInput.placeholder = 'WIF Private Key';
    wifPrivkeyInput.required = true;

    const importText = document.createElement('div');
    importText.textContent = 'If importing key, it is self-custodial';
    importText.style.color = '#4caf50'; // Green hue
    importText.style.fontSize = '12px'; // Smaller text
    importText.style.marginBottom = '10px';

    const saveButton = document.createElement('button');
    Object.assign(saveButton.style, buttonStyle);
    saveButton.textContent = 'Save Wallet';

    const backButton = document.createElement('button');
    Object.assign(backButton.style, buttonStyle);
    backButton.textContent = 'Back';
    backButton.style.marginBottom = '10px'; // Reduce bottom margin
    backButton.style.marginTop = '10px'; // Ensure top margin for spacing
    backButton.addEventListener('click', walletUI);

    // Continue with the rest of the form elements
    form.appendChild(dropdown);
    form.appendChild(getNewAddressButton);
    form.appendChild(custodialText);
    form.appendChild(generateKeyButton);
    form.appendChild(selfCustodialText);
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
        generateKeyButton.disabled = disable;
        getNewAddressButton.textContent = disable ? 'Creating Wallet...' : 'Get New Address';
        generateKeyButton.textContent = disable ? 'Creating Wallet...' : 'Generate New Address';
        getNewAddressButton.style.backgroundColor = disable ? '#555' : '#333';
        generateKeyButton.style.backgroundColor = disable ? '#555' : '#333';
    }
}
