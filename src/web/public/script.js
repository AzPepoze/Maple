const logContainer = document.getElementById('log-container');

function addLog(message) {
    const logElement = document.createElement('div');
    logElement.className = 'log-message';
    logElement.textContent = message;
    logContainer.appendChild(logElement);
    logContainer.scrollTop = logContainer.scrollHeight;
}

async function fetchLog() {
    try {
        const response = await fetch('/log.log');
        const text = await response.text();
        logContainer.innerHTML = ''; // Clear previous logs
        text.split('\n').forEach(line => {
            if (line.trim() !== '') {
                addLog(line);
            }
        });
    } catch (error) {
        console.error('Error fetching log:', error);
    }
}

// Fetch log initially
fetchLog();

// Fetch log every 3 seconds
setInterval(fetchLog, 3000);

const userIdInput = document.getElementById('user-id-input');
const dmMessageInput = document.getElementById('dm-message-input');
const sendDmButton = document.getElementById('send-dm-button');

sendDmButton.addEventListener('click', async () => {
    const userId = userIdInput.value;
    const message = dmMessageInput.value;

    if (userId.trim() === '' || message.trim() === '') {
        addLog('Error: User ID and message cannot be empty.');
        return;
    }

    try {
        const response = await fetch('/send-dm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, message })
        });
        const result = await response.json();
        addLog(result.status);
        if (result.error) {
            addLog(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error sending DM:', error);
        addLog('Error: Could not send DM.');
    }
});