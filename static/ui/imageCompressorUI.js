import { mintSelectionUI } from './mintSelectionUI.js'; // Import your mintSelectionUI function

export function imageCompressorUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Image Compressor';
    title.className = 'page-title';
    landingPage.appendChild(title);

    // Back Button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button back-button';
    backButton.addEventListener('click', () => {
        mintSelectionUI();
    });
    landingPage.appendChild(backButton);

    // File Input
    const fileInputLabel = document.createElement('label');
    fileInputLabel.className = 'styled-button';
    fileInputLabel.textContent = 'Choose File';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleFileSelection);

    fileInputLabel.appendChild(fileInput);
    landingPage.appendChild(fileInputLabel);

    // Quality Slider
    const qualityContainer = document.createElement('div');
    qualityContainer.className = 'slider-container';
    qualityContainer.style.width = '300px'; // Set a fixed width for consistency

    const qualityLabel = document.createElement('label');
    qualityLabel.textContent = 'Compression Quality: ';
    qualityContainer.appendChild(qualityLabel);

    const qualityValue = document.createElement('span');
    qualityValue.textContent = '0.9';

    const qualitySlider = document.createElement('input');
    qualitySlider.type = 'range';
    qualitySlider.min = '0.1';
    qualitySlider.max = '1';
    qualitySlider.step = '0.01';
    qualitySlider.value = '0.9';
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value;
    });
    qualityContainer.appendChild(qualitySlider);
    qualityContainer.appendChild(qualityValue);
    landingPage.appendChild(qualityContainer);

    // Scale Slider
    const scaleContainer = document.createElement('div');
    scaleContainer.className = 'slider-container';
    scaleContainer.style.width = '300px'; // Set the same fixed width

    const scaleLabel = document.createElement('label');
    scaleLabel.textContent = 'Scale: ';
    scaleContainer.appendChild(scaleLabel);

    const scaleValue = document.createElement('span');
    scaleValue.textContent = '0.9';

    const scaleSlider = document.createElement('input');
    scaleSlider.type = 'range';
    scaleSlider.min = '0.1';
    scaleSlider.max = '1';
    scaleSlider.step = '0.01';
    scaleSlider.value = '0.9';
    scaleSlider.addEventListener('input', () => {
        scaleValue.textContent = scaleSlider.value;
    });
    scaleContainer.appendChild(scaleSlider);
    scaleContainer.appendChild(scaleValue);
    landingPage.appendChild(scaleContainer);

    // Compress Button
    const compressButton = document.createElement('button');
    compressButton.textContent = 'Compress';
    compressButton.className = 'styled-button';
    compressButton.addEventListener('click', compressImage);
    landingPage.appendChild(compressButton);

    // Progress Display
    const progressDisplay = document.createElement('p');
    progressDisplay.className = 'progress-display';
    landingPage.appendChild(progressDisplay);

    // Image Display
    const imageDisplay = document.createElement('img');
    imageDisplay.className = 'compressed-image';
    imageDisplay.style.maxWidth = '50vw'; // Set to half the viewport width
    imageDisplay.style.maxHeight = '50vh'; // Set to half the viewport height
    imageDisplay.style.objectFit = 'contain'; // Maintain aspect ratio
    landingPage.appendChild(imageDisplay);

    // Selected File Reference
    let selectedFile = null;

    // Handle File Selection
    function handleFileSelection(event) {
        selectedFile = event.target.files[0];
        if (selectedFile) {
            const imageUrl = URL.createObjectURL(selectedFile);
            imageDisplay.src = imageUrl;
            progressDisplay.textContent = `Original File Size: ${(selectedFile.size / 1024).toFixed(2)} KB`;
        }
    }

    // Compress Image Function
    async function compressImage() {
        if (!selectedFile) {
            alert('Please select an image first.');
            return;
        }

        const quality = parseFloat(qualitySlider.value);
        const scale = parseFloat(scaleSlider.value);

        progressDisplay.textContent = 'Compressing... Please wait.';
        compressButton.disabled = true;

        try {
            const imageBitmap = await createImageBitmap(selectedFile);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions
            const newWidth = Math.round(imageBitmap.width * scale);
            const newHeight = Math.round(imageBitmap.height * scale);
            canvas.width = newWidth;
            canvas.height = newHeight;

            // Draw image onto canvas
            ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

            // Convert canvas to data URL with specified quality
            const dataUrl = canvas.toDataURL('image/jpeg', quality);

            // Convert data URL to Blob
            const compressedBlob = dataURLToBlob(dataUrl);

            // Create object URL for compressed image
            const compressedImageUrl = URL.createObjectURL(compressedBlob);

            // Display compressed image
            imageDisplay.onload = () => {
                // Adjust the image size to fit the viewport
                imageDisplay.style.width = 'auto';
                imageDisplay.style.height = 'auto';
            };
            imageDisplay.src = compressedImageUrl; // Set the source after onload is defined

            // Display compression details with an additional 20 KB
            const blobSizeKB = (compressedBlob.size / 1024).toFixed(2);
            const adjustedSizeKB = (parseFloat(blobSizeKB) + 20).toFixed(2);
            progressDisplay.textContent = `Compression completed. Quality: ${(quality * 100).toFixed(0)}%, Scale: ${(scale * 100).toFixed(0)}%, File Size: ${adjustedSizeKB} KB`;

            console.log('Compressed image blob:', compressedBlob);
        } catch (error) {
            console.error('Compression error:', error);
            alert('An error occurred during compression.');
            progressDisplay.textContent = '';
        } finally {
            compressButton.disabled = false;
        }
    }

    // Helper function to convert data URL to Blob
    function dataURLToBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new Blob([u8arr], { type: mime });
    }
}
