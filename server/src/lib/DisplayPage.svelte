<script lang="ts">
    import { onMount } from "svelte";
    import { relayout } from "$lib/relayout";

    let { config, children } = $props();

    let page: HTMLDivElement;

    let relayoutQueued = false;

    function queueRelayout() {
        if (relayoutQueued) return;

        relayoutQueued = true;

        requestAnimationFrame(() => {
            relayoutQueued = false;
            relayout(page, config, queueRelayout);
        });
    }

    $effect(() => {
        config;
        queueRelayout();
    });

    onMount(() => {
        const mo = new MutationObserver(queueRelayout);

        mo.observe(page, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false,
        });

        const interval = setInterval(queueRelayout, 3000);

        queueRelayout();

        return () => {
            mo.disconnect();
            clearInterval(interval);
        };
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="/page-content.css" />
    <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<div class="DisplayContainer">
<div class="DisplayPage" bind:this={page}>
    {@render children()}
</div>
</div>

<style>
    div.DisplayPage {
        width: 8.5in;
        border: 2px solid black;
        margin: 0.5in auto;
        text-align: center;
        background: #f4f4f9;

        display: flex;
        justify-content: space-evenly;
        flex-direction: column;
    }

    .DisplayPage {
        gap: var(--page-gap);
        padding-top: var(--page-padding);
        padding-bottom: var(--page-padding);
        box-sizing: border-box;
    }

    .DisplayContainer {
        width: 8.5in;
        margin: 0 auto;
        position: relative;
    }

    .DisplayContainer button#rerender {
        position: absolute;
        left: -30px;
        width: 20px;
        height: 100px;
        top: calc((8.5in) / 2 + 50px);
        writing-mode: sideways-lr;
    }
</style>
