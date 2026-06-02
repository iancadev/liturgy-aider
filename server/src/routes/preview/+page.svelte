<script lang="ts">
    import DisplayPage from "./DisplayPage.svelte";
    let { data } = $props();

    const timers = new Map<number, number>();
    function send(
        element: HTMLButtonElement,
        index: number,
        direction: string,
    ) {
        element.disabled = true;

        clearTimeout(timers.get(index));

        timers.set(
            index,
            window.setTimeout(async () => {
                const response = await fetch("/api/move-break", {
                    method: "POST",
                    body: JSON.stringify({ index, direction }),
                    headers: { "Content-Type": "application/json" },
                });
                element.disabled = false;
            }, 100),
        );
    }

    let displayButton = (i) => {
        return data.normalSplits[i] || i >= data.normalSplits.length;
    };

    let buttonIndices = $derived.by(() => {
        const arr = [];
        let j = 0;
        for (let i = 0; i < data.pages.length; i++) {
            if (displayButton(i)) arr.push(j++);
            else arr.push(-1);
        }
        return arr;
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="/preview.css" />
    <link rel="stylesheet" href="/modifier-keywords.css" />
</svelte:head>

<a class="landing" href="/">Menu</a>
<div class="PrintPages">
    <div id="first-page-reminder">
        <div
            style="width: 100%; height: 50px; border-left: 1px solid black; border-right: 1px solid black; border-top: 1px solid grey;"
        >
            <p style="color: red;">
                Make sure to set Margins in your print settings to None!
            </p>
        </div>
    </div>
    {#each data.pages as page, i}
        <DisplayPage>
            {@html page}
        </DisplayPage>
        {#if displayButton(i)}
            <div class="PageBreakButtons">
                <button onclick={() => send(this, buttonIndices[i], "up")}>↑↑↑↑</button>
                <small>(page break)</small>
                <button onclick={() => send(this, buttonIndices[i], "down")}>↓↓↓↓</button>
            </div>
        {:else}
            <div class="PageBreakButtons">
                <small>(image split)</small>
            </div>
        {/if}
    {/each}
</div>

<style>
    .PageBreakButtons {
        text-align: center;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 30px;
    }
    .PageBreakButtons button {
        padding: 5px 5px;
        font-size: 20px;
    }
</style>
