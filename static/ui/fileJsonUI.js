import { mintFolderUI } from './mintFolderUI.js'; // Adjust the path as necessary

export function fileJsonUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Title
    const title = document.createElement('h1');
    title.textContent = 'File JSON Viewer';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        mintFolderUI(); // Navigate back to Mint Folder UI
    });
    landingPage.appendChild(backButton);

    // Scrollable iframe container
    const iframe = document.createElement('iframe');
    iframe.className = 'scrollable-iframe'; // Add a class for styling
    iframe.style.width = '300px'; // Set width
    iframe.style.height = '550px'; // Set height to make it shorter
    iframe.style.border = '1px solid #000'; // Add border
    iframe.style.overflow = 'auto'; // Enable scrolling
    landingPage.appendChild(iframe);

    // Load JSON data into the iframe
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write('<html><body style="background-color: black; color: white;"></body></html>');
    doc.close();
    const body = doc.body;

    // Retrieve JSON data from local storage
    const jsonData = JSON.parse(localStorage.getItem('folderFileData')) || [];
    console.log('Retrieved JSON data:', jsonData); // Debugging log
    const pre = document.createElement('pre');
    pre.className = 'json-display'; // Use a class for styling
    pre.textContent = JSON.stringify(jsonData, null, 2); // Pretty print with indentation
    body.appendChild(pre);
}
