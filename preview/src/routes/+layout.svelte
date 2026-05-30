<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	// TO-DO: import central style sheet

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
