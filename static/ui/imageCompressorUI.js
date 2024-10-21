import { mintSelectionUI } from './mintSelectionUI.js'; // Import the mintSelectionUI function

export function imageCompressorUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Create Title
    const title = document.createElement('h1');
    title.textContent = 'Image Compressor';
    title.className = 'page-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Back Button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'styled-button back-button'; // Use a class for styling
    backButton.addEventListener('click', () => {
        mintSelectionUI(); // Navigate back to mint selection UI
    });
    landingPage.appendChild(backButton);

    // Open Image Button
    const openImageLabel = document.createElement('label');
    openImageLabel.className = 'styled-button open-image-button'; // Use a class for styling
    openImageLabel.textContent = 'Choose File';

    const openImageButton = document.createElement('input');
    openImageButton.type = 'file';
    openImageButton.accept = 'image/*';
    openImageButton.style.display = 'none'; // Hide the default file input
    openImageButton.addEventListener('change', handleImageSelection);

    openImageLabel.appendChild(openImageButton);
    landingPage.appendChild(openImageLabel);

    // Compress Button
    const compressButton = document.createElement('button');
    compressButton.textContent = 'Compress';
    compressButton.className = 'styled-button compress-button'; // Use a class for styling
    compressButton.addEventListener('click', compressImage);
    landingPage.appendChild(compressButton);

    // Image Display Area
    const imageDisplay = document.createElement('img');
    imageDisplay.className = 'compressed-image';
    imageDisplay.style.maxWidth = '100%'; // Ensure the image fits the viewport
    imageDisplay.style.height = 'auto';
    landingPage.appendChild(imageDisplay);

    // Progress Display
    const progressDisplay = document.createElement('p');
    progressDisplay.className = 'progress-display';
    landingPage.appendChild(progressDisplay);

    // Function to Handle Image Selection
    function handleImageSelection(event) {
        const file = event.target.files[0];
        if (file) {
            // Display the selected image (optional)
            const imageUrl = URL.createObjectURL(file);
            imageDisplay.src = imageUrl;
            console.log('Selected file:', file);
        }
    }

    // Function to Compress the Image
    async function compressImage() {
        const file = openImageButton.files[0];
        if (!file) {
            alert('Please select an image first.');
            return;
        }

        progressDisplay.textContent = 'Compressing... Please wait.';
        compressButton.disabled = true;

        try {
            const imageBitmap = await createImageBitmap(file);
            const originalWidth = imageBitmap.width;
            const originalHeight = imageBitmap.height;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let bestScale = 0.01; // Start with 1%
            let bestQuality = 0.01; // Start with 1%
            let bestBlob = null;

            // Initialize previous settings
            let previousScale = bestScale;
            let previousQuality = bestQuality;
            let previousBlob = null;

            // Outer Loop: Iterate through scales from 1% to 100% in 5% steps
            for (let scalePercent = 1; scalePercent <= 100; scalePercent += 5) {
                const scale = scalePercent / 100;

                // Calculate new dimensions based on current scale
                const newWidth = Math.max(Math.round(originalWidth * scale), 1);
                const newHeight = Math.max(Math.round(originalHeight * scale), 1);

                canvas.width = newWidth;
                canvas.height = newHeight;

                ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

                let suitableQualityFound = false;
                let currentBestQuality = 0.01;
                let currentBestBlob = null;

                // Inner Loop: Iterate through qualities from 1% to 100%
                for (let qualityPercent = 1; qualityPercent <= 100; qualityPercent++) {
                    const quality = qualityPercent / 100;

                    // Compress the image to WebP format with the current quality
                    const blob = await new Promise((resolve) => {
                        canvas.toBlob(resolve, 'image/webp', quality);
                    });

                    if (blob.size <= 100 * 1024) { // 100KB
                        // Update current best quality and blob at this scale
                        currentBestQuality = quality;
                        currentBestBlob = blob;
                        suitableQualityFound = true;
                        // Continue to find a higher quality within this scale
                    } else {
                        // Since we're iterating quality from low to high,
                        // once size exceeds 100KB, no need to check higher qualities
                        break;
                    }

                    // Yield to the event loop every 10 quality iterations to keep UI responsive
                    if (qualityPercent % 10 === 0) {
                        await new Promise((resolve) => setTimeout(resolve, 0));
                    }
                }

                if (suitableQualityFound) {
                    // Update the bestScale, bestQuality, and bestBlob
                    bestScale = scale;
                    bestQuality = currentBestQuality;
                    bestBlob = currentBestBlob;

                    // Update previous settings for potential fallback
                    previousScale = bestScale;
                    previousQuality = bestQuality;
                    previousBlob = bestBlob;

                    // Check if we've reached the maximum scale
                    if (scalePercent + 5 > 100) {
                        break;
                    }
                } else {
                    // No suitable quality found at this scale, use previous settings
                    break;
                }

                // Yield to the event loop every 10 scale iterations to keep UI responsive
                if (scalePercent % 10 === 0) {
                    await new Promise((resolve) => setTimeout(resolve, 0));
                }
            }

            if (bestBlob) {
                const imageUrl = URL.createObjectURL(bestBlob);
                imageDisplay.src = imageUrl;
                progressDisplay.textContent = `Compression successful! Scale: ${(bestScale * 100).toFixed(0)}%, Quality: ${(bestQuality * 100).toFixed(0)}%, File size: ${(bestBlob.size / 1024).toFixed(2)}KB`;
                console.log('Compressed image blob:', bestBlob);
                console.log(`Final Quality: ${(bestQuality * 100).toFixed(0)}%, Scale: ${(bestScale * 100).toFixed(0)}%`);
            } else {
                progressDisplay.textContent = 'Unable to compress image to under 100KB with the current settings.';
                alert('Unable to compress image to under 100KB. Consider using a different image or adjusting the compression parameters.');
            }
        } catch (error) {
            console.error('Error compressing image:', error);
            alert('An error occurred during image compression.');
            progressDisplay.textContent = '';
        } finally {
            compressButton.disabled = false;
        }
    }

    // Add more UI elements for image compressor as needed
}
