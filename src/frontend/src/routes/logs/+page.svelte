<script lang="ts">
    import { onMount } from 'svelte';

    let logs: string = 'Loading logs...';

    onMount(async () => {
        try {
            const response = await fetch('/log.log');
            if (response.ok) {
                logs = await response.text();
            } else {
                logs = `Failed to load logs: ${response.statusText}`;
            }
        } catch (error: any) {
            logs = `Error fetching logs: ${error.message}`;
        }
    });
</script>

<style>
    .log-container {
        background-color: #1e1e1e;
        color: #d4d4d4;
        font-family: 'Cascadia Code', 'Consolas', monospace;
        font-size: 0.9em;
        padding: 15px;
        border-radius: 8px;
        overflow-y: auto;
        max-height: 80vh;
        white-space: pre-wrap;
        word-break: break-all;
        line-height: 1.4;
        border: 1px solid #333;
    }

    h1 {
        color: #f0f0f0;
        margin-bottom: 20px;
        font-size: 1.8em;
        border-bottom: 2px solid #444;
        padding-bottom: 10px;
    }
</style>

<h1>Application Logs</h1>

<div class="log-container">
    {logs}
</div>
