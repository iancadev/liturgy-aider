<script lang="ts">
    import { onMount } from "svelte";
    import { relayout } from "$lib/relayout";

    let { children } = $props();

    let page: HTMLDivElement;

    let relayoutQueued = false;

    function queueRelayout() {
        if (relayoutQueued) return;

        relayoutQueued = true;

        requestAnimationFrame(() => {
            relayoutQueued = false;
            relayout(page);
        });
    }

    onMount(() => {
        const mo = new MutationObserver(queueRelayout);

        mo.observe(page, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false,
        });

        queueRelayout();

        return () => mo.disconnect();
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="/page-content.css" />
</svelte:head>

<div
    class="DisplayPage"
    bind:this={page}
    
>
    {@render children()}
</div>

<style>
    div.DisplayPage {
        width: 8.5in;
        border: 2px solid black;
        margin: 0.5in auto;
        text-align: center;
        background: #f4f4f9;

        display: flex;
        justify-content: center;
        flex-direction: column;
        gap: 50px;
    }

    .DisplayPage {
        gap: var(--page-gap);
        padding-top: var(--page-padding);
        padding-bottom: var(--page-padding);
        box-sizing: border-box;
    }
</style>
