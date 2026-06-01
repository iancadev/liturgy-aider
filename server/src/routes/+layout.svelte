<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";

	import { invalidate } from "$app/navigation";
	import { onMount } from "svelte";

	let { data, children } = $props();

	let es: EventSource | null = null;
	let es2: EventSource | null = null;

	function startStreams() {
		// HTML watcher (now tied to cookie via server-provided data.html_file)
		es?.close();
		es = new EventSource("/api/watch-styles");
		es.onmessage = async () => {
			await invalidate("watch:styles");
		};

		es2?.close();
		es2 = new EventSource("/api/watch-html");
		es2.onmessage = async () => {
			await invalidate("watch:html_file");
		};
	}

	// restart streams whenever html_file changes
	$effect(() => {
		data.html_file; // <- reactive dependency from layout.server.ts
		startStreams();
	});

	onMount(() => {
		return () => {
			es?.close();
			es2?.close();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="/main.css" />
	{#each data.stylesheets as stylesheet}
		<link rel="stylesheet" href={`${stylesheet}?v=${data.now}`} />
	{/each}
</svelte:head>

{@render children()}
