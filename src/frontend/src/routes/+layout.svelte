<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import { fade } from "svelte/transition";
	import Home from "./Home.svelte";
	import Logs from "./Logs.svelte";
	import Api from "./Api.svelte";

	let currentPage: string = "home";

	function navigate(pageName: string) {
		currentPage = pageName;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="navbar">
	<button type="button" on:click={() => navigate("home")} class:active={currentPage === "home"}>Home</button>
	<button type="button" on:click={() => navigate("logs")} class:active={currentPage === "logs"}>Logs</button>
	<button type="button" on:click={() => navigate("api")} class:active={currentPage === "api"}>API Interaction</button
	>
</nav>

<div class="content">
	{#if currentPage === "home"}
		<div class="full" transition:fade>
			<Home />
		</div>
	{:else if currentPage === "logs"}
		<div class="full" transition:fade>
			<Logs />
		</div>
	{:else if currentPage === "api"}
		<div class="full" transition:fade>
			<Api />
		</div>
	{/if}
</div>

<style>
	:global(.full) {
		display: flex;
		width: 100%;
	}

	:global(body) {
		margin: 0;
		font-family: "Arial", sans-serif;
		color: #eee;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	:global(.container) {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 20px;
		background-color: #282c34;
		color: #abb2bf;
		border-radius: 8px;
		width: 100%;
	}

	:global(.section) {
		background-color: #323842;
		padding: 15px;
		border-radius: 8px;
		border: 1px solid #3e4451;
	}

	:global(h1) {
		color: #61afef;
		margin-bottom: 20px;
		border-bottom: 2px solid #3e4451;
		padding-bottom: 10px;
	}

	.navbar {
		display: flex;
		justify-content: center;
		background-color: #333;
		padding: 10px 0;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		position: sticky;
		top: 0;
		z-index: 1000;
	}

	.navbar button {
		background-color: transparent;
		border: none;
		color: #eee;
		text-decoration: none;
		padding: 10px 20px;
		margin: 0 10px;
		border-radius: 5px;
		transition: background-color 0.3s ease;
		cursor: pointer;
	}

	.navbar button:hover {
		background-color: #555;
	}

	.navbar button.active {
		background-color: #555;
		font-weight: bold;
	}

	.content {
		padding: 20px;
		max-width: 1200px;
		margin: 20px auto;
		flex: 1;
		overflow-y: auto;
		width: 100%;
		display: flex;
	}
</style>
