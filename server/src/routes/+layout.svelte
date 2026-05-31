<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	// TO-DO: import central style sheet

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="/main.css" />
	{#each data.stylesheets as stylesheet}
		<link rel="stylesheet" href={stylesheet} />
	{/each}
</svelte:head>

{@render children()}
