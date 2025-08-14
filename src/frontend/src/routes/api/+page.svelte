<script lang="ts">
    let userId: string = '';
    let message: string = '';
    let dmResponse: string = '';

    async function sendDirectMessage() {
        dmResponse = 'Sending...';
        try {
            const response = await fetch('/send-dm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, message }),
            });

            const result = await response.json();
            if (response.ok) {
                dmResponse = `Success: ${JSON.stringify(result, null, 2)}`;
            } else {
                dmResponse = `Error: ${JSON.stringify(result, null, 2)}`;
            }
        } catch (error: any) {
            dmResponse = `Network Error: ${error.message}`;
        }
    }
</script>

<style>
    .api-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
        background-color: #282c34;
        color: #abb2bf;
        border-radius: 8px;
    }

    h1 {
        color: #61afef;
        margin-bottom: 20px;
        font-size: 1.8em;
        border-bottom: 2px solid #3e4451;
        padding-bottom: 10px;
    }

    .api-section {
        background-color: #323842;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #3e4451;
    }

    .api-section h2 {
        color: #98c379;
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 1.4em;
    }

    .form-group {
        margin-bottom: 10px;
    }

    .form-group label {
        display: block;
        margin-bottom: 5px;
        color: #c678dd;
    }

    .form-group input[type="text"],
    .form-group textarea {
        width: calc(100% - 20px);
        padding: 10px;
        border: 1px solid #5c6370;
        border-radius: 4px;
        background-color: #3e4451;
        color: #abb2bf;
        font-family: 'Cascadia Code', 'Consolas', monospace;
    }

    .form-group textarea {
        resize: vertical;
        min-height: 80px;
    }

    button {
        background-color: #61afef;
        color: white;
        padding: 10px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1em;
        transition: background-color 0.3s ease;
    }

    button:hover {
        background-color: #528cbf;
    }

    .response-box {
        background-color: #1e1e1e;
        color: #d4d4d4;
        font-family: 'Cascadia Code', 'Consolas', monospace;
        font-size: 0.9em;
        padding: 10px;
        border-radius: 4px;
        margin-top: 15px;
        white-space: pre-wrap;
        word-break: break-all;
        border: 1px solid #333;
    }
</style>

<div class="api-container">
    <h1>API Interaction</h1>

    <div class="api-section">
        <h2>Send Direct Message (Discord)</h2>
        <div class="form-group">
            <label for="userId">User ID:</label>
            <input type="text" id="userId" bind:value={userId} placeholder="Enter Discord User ID" />
        </div>
        <div class="form-group">
            <label for="message">Message:</label>
            <textarea id="message" bind:value={message} placeholder="Enter message to send"></textarea>
        </div>
        <button on:click={sendDirectMessage}>Send DM</button>
        {#if dmResponse}
            <div class="response-box">
                <pre>{dmResponse}</pre>
            </div>
        {/if}
    </div>
</div>
