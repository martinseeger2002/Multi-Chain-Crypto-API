import { landingPageUI } from './landingPageUI.js'; // Ensure this is correctly imported

export function terminalUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Apply styles to the landing page
    landingPage.className = 'terminal-landing-page'; // Use a class for styling

    // Create and style the title
    const title = document.createElement('h1');
    title.textContent = 'Terminal';
    title.className = 'terminal-title'; // Use a class for styling
    landingPage.appendChild(title);

    // Create and style the iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'terminal-iframe'; // Add a class for styling
    iframe.style.width = '100%';
    iframe.style.height = '500px';
    iframe.style.border = '1px solid #000';
    landingPage.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    const iframeContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                background-color: black;
                color: green;
                font-family: monospace;
                margin: 0;
                padding: 10px;
            }
            .terminal-line {
                display: flex;
                align-items: center;
            }
            .prompt {
                display: inline;
            }
            .user-input {
                display: inline;
            }
            .predicted-input {
                color: rgba(255, 255, 255, 0.5);
            }
            .blinking-cursor::after {
                content: '|';
                animation: blink 1s step-end infinite;
            }
            @keyframes blink {
                from, to { opacity: 0; }
                50% { opacity: 1; }
            }
            .terminal-response {
                margin-left: 20px;
                white-space: pre-wrap;
            }
        </style>
    </head>
    <body>
        <div id="terminal"></div>
        <script>
            (function() {
                const username = localStorage.getItem('username') || 'user';
                const ticker = 'dogecoin';
                const promptText = \`\${username}@:/# \${ticker}-cli \`;
                const commandHistory = [];
                let historyIndex = -1;
                const commands = ['help', 'getrawtransaction', 'help getrawtransaction', 'gettxout', 'dopewars']; // Added 'dopewars' command

                const terminal = document.getElementById('terminal');

                // Function to type out text one character at a time
                function typeText(element, text, speed = 50) {
                    return new Promise((resolve) => {
                        let index = 0;
                        const interval = setInterval(() => {
                            if (index < text.length) {
                                element.textContent += text[index++];
                            } else {
                                clearInterval(interval);
                                resolve();
                            }
                        }, speed);
                    });
                }

                // Start the terminal
                async function startTerminal() {
                    // Create the initial prompt line
                    const line = document.createElement('div');
                    line.className = 'terminal-line';

                    const promptSpan = document.createElement('span');
                    promptSpan.className = 'prompt';
                    line.appendChild(promptSpan);

                    const userInputSpan = document.createElement('span');
                    userInputSpan.className = 'user-input blinking-cursor';
                    line.appendChild(userInputSpan);

                    const predictedInputSpan = document.createElement('span');
                    predictedInputSpan.className = 'predicted-input';
                    line.appendChild(predictedInputSpan);

                    terminal.appendChild(line);

                    // Type out the prompt one character at a time
                    await typeText(promptSpan, promptText + ' '); // Add a space after the prompt

                    let currentInput = '';
                    let predictedInput = '';
                    historyIndex = -1;

                    // Automatically focus the terminal for input
                    terminal.focus();

                    window.addEventListener('keydown', handleKeyDown);

                    function handleKeyDown(event) {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            window.removeEventListener('keydown', handleKeyDown);

                            // Remove blinking cursor after command entry
                            userInputSpan.classList.remove('blinking-cursor');

                            // Process the command
                            processCommand(currentInput);

                            // Add command to history if not empty
                            if (currentInput.trim() !== '') {
                                commandHistory.unshift(currentInput);
                                if (commandHistory.length > 5) {
                                    commandHistory.pop();
                                }
                            }
                            historyIndex = -1;
                        } else if (event.key === 'Backspace') {
                            event.preventDefault();
                            if (currentInput.length > 0) {
                                currentInput = currentInput.slice(0, -1);
                                userInputSpan.textContent = currentInput;
                                updatePredictedInput();
                            }
                        } else if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            if (commandHistory.length > 0) {
                                if (historyIndex < commandHistory.length - 1) {
                                    historyIndex++;
                                }
                                currentInput = commandHistory[historyIndex];
                                userInputSpan.textContent = currentInput;
                                updatePredictedInput();
                            }
                        } else if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            if (historyIndex > 0) {
                                historyIndex--;
                                currentInput = commandHistory[historyIndex];
                            } else {
                                historyIndex = -1;
                                currentInput = '';
                            }
                            userInputSpan.textContent = currentInput;
                            updatePredictedInput();
                        } else if (event.key === 'ArrowRight') {
                            event.preventDefault();
                            if (predictedInput) {
                                currentInput += predictedInput;
                                userInputSpan.textContent = currentInput;
                                predictedInputSpan.textContent = '';
                                predictedInput = '';
                            }
                        } else if (event.key.length === 1) {
                            event.preventDefault();
                            currentInput += event.key;
                            userInputSpan.textContent = currentInput;
                            updatePredictedInput();
                        }
                    }

                    function updatePredictedInput() {
                        const input = currentInput.trim();
                        if (input === '') {
                            predictedInputSpan.textContent = '';
                            predictedInput = '';
                            return;
                        }

                        // Find matching commands
                        const matches = commands.filter(cmd => cmd.startsWith(input));
                        if (matches.length > 0) {
                            const match = matches[0];
                            predictedInput = match.slice(input.length);
                            predictedInputSpan.textContent = predictedInput;
                        } else {
                            predictedInputSpan.textContent = '';
                            predictedInput = '';
                        }
                    }

                    async function processCommand(command) {
                        // Create a new line for the response
                        const responseLine = document.createElement('div');
                        responseLine.className = 'terminal-response';
                        terminal.appendChild(responseLine);

                        // Process the command and get the response
                        let responseText = '';

                        if (command.trim() === 'help') {
                            responseText = 'Available commands:\\n- help <command>\\n- getrawtransaction <txid>';
                        } else if (command.trim() === 'help getrawtransaction') {
                            responseText = 'Usage: getrawtransaction <txid>';
                        } else if (command.startsWith('getrawtransaction ')) {
                            const txid = command.split(' ')[1];
                            responseText = \`Fetching transaction \${txid}...\`;
                            // Simulate an API call
                            // const response = await fetch(\`/api/v1/get_tx/dogecoin/\${txid}\`);
                            // const data = await response.json();
                            // responseText = JSON.stringify(data, null, 2);
                        } else if (command.trim() === 'exit') {
                            // Simulate a click on the back button
                            document.getElementById('back-button').click();
                            return; // Exit the function early
                        } else {
                            responseText = 'Command not found';
                        }

                        await typeText(responseLine, responseText);

                        // Start a new prompt
                        startTerminal();
                    }
                }

                // Start the terminal for the first time
                startTerminal();
            })();
        </script>
    </body>
    </html>
    `;

    iframeDoc.open();
    iframeDoc.write(iframeContent);
    iframeDoc.close();

    // Add Back button
    const backButton = document.createElement('button');
    backButton.id = 'back-button'; // Assign an ID for easy access
    backButton.textContent = 'Back';
    backButton.className = 'styled-button'; // Use a class for styling
    backButton.addEventListener('click', landingPageUI);
    landingPage.appendChild(backButton);
}

// Function to return the Dope Wars HTML
export function getDopeWarsHTML() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                background-color: black;
                color: green;
                font-family: monospace;
                margin: 0;
                padding: 10px;
            }
            .game-content {
                padding: 10px;
                font-size: 18px;
            }
            .styled-button {
                background-color: #4CAF50;
                border: none;
                color: white;
                padding: 10px 24px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                margin: 4px 2px;
                cursor: pointer;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="game-content">
            <h1>Dope Wars</h1>
            <p>Welcome to Dope Wars! Game content goes here.</p>
            <button id="exit-game" class="styled-button">Exit Game</button>
        </div>
        <script>
            document.getElementById('exit-game').addEventListener('click', function() {
                // Reload the terminal
                window.location.reload();
            });
        </script>
    </body>
    </html>
    `;
}
