// Remove the import statement
// import p5 from 'p5';

export function walletUI() {
    const walletPage = document.getElementById('wallet-page');
    walletPage.innerHTML = ''; // Clear existing content

    // Initialize p5.js sketch
    new p5((sketch) => {
        sketch.setup = function() {
            sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);
            sketch.noLoop(); // No continuous drawing needed
        };

        sketch.draw = function() {
            sketch.background(255); // White background for mobile visibility

            // Display selected wallet details
            const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
            const selectedWalletLabel = localStorage.getItem('selectedWalletLabel');
            const selectedWallet = wallets.find(wallet => wallet.label === selectedWalletLabel);

            if (selectedWallet) {
                sketch.fill(0);
                sketch.textSize(24);
                sketch.text(`Balance: ${selectedWallet.balance || 0}`, 10, 40);
                sketch.text(`UTXOs: ${selectedWallet.utxos ? selectedWallet.utxos.length : 0}`, 10, 80);
            } else {
                console.warn('No selected wallet found.');
            }

            // Create action buttons
            const actions = [
                { text: 'Send', onClick: () => console.log('Send action') },
                { text: 'Receive', onClick: () => console.log('Receive action') },
                { text: 'Mint', onClick: () => console.log('Mint action') },
                { text: 'Market', onClick: () => console.log('Market action') }
            ];

            actions.forEach(({ text, onClick }, index) => {
                const buttonY = 120 + index * 40;
                sketch.fill(200);
                sketch.rect(10, buttonY, 100, 30);
                sketch.fill(0);
                sketch.text(text, 20, buttonY + 20);

                // Add interaction
                sketch.mousePressed = function() {
                    if (sketch.mouseX > 10 && sketch.mouseX < 110 && sketch.mouseY > buttonY && sketch.mouseY < buttonY + 30) {
                        onClick();
                    }
                };
            });
        };

        sketch.windowResized = function() {
            sketch.resizeCanvas(sketch.windowWidth, sketch.windowHeight);
        };
    }, walletPage);
}
