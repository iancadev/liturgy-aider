<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";

	// TO-DO: import central style sheet
	import { invalidate } from "$app/navigation";
	import { onMount } from "svelte";

	onMount(() => {
		const es = new EventSource("/api/watch-styles");
		es.onmessage = async () => {
			await invalidate("watch:styles");
		};

		const es2 = new EventSource("/api/watch-html");
		es2.onmessage = async () => {
			await invalidate("watch:html_file");
		};

		return () => {
			es.close();
			es2.close();
		}
	});

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="/main.css" />
	{#each data.stylesheets as stylesheet}
		<link rel="stylesheet" href={`${stylesheet}?v=${data.now}`} />
	{/each}
</svelte:head>

{@render children()}
