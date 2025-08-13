<div class="full-screen">
	<slot></slot>
</div>

<style>
	.full-screen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
