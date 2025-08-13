<script lang="ts">
	import { onMount, onDestroy } from "svelte";

	let logs: string = "Loading logs...";
	let intervalId: NodeJS.Timeout;

	async function fetchLogs() {
		try {
			const response = await fetch("/log.log");
			if (response.ok) {
				logs = await response.text();
			} else {
				logs = `Failed to load logs: ${response.statusText}`;
			}
		} catch (error: any) {
			logs = `Error fetching logs: ${error.message}`;
		}
	}

	onMount(async () => {
		await fetchLogs();
		intervalId = setInterval(fetchLogs, 5000);
	});

	onDestroy(() => {
		clearInterval(intervalId);
	});
</script>

<div class="container">
	<div class="section">
		<h1>Application Logs</h1>
		<div class="log-container">
			{logs}
		</div>
	</div>
</div>

<style>
	.container {
		height: 100%;
	}

	.section {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	h1 {
		font-size: 1.8em;
	}

	.log-container {
		background-color: #1e1e1e;
		color: #d4d4d4;
		font-family: "Cascadia Code", "Consolas", monospace;
		font-size: 0.9em;
		padding: 15px;
		border-radius: 8px;
		overflow-y: auto;
		white-space: pre-wrap;
		word-break: break-all;
		line-height: 1.4;
		border: 1px solid #333;
		flex: 1;
		min-height: 0;
	}
</style>
