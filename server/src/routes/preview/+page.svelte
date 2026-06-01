<script lang="ts">
    import DisplayPage from "./DisplayPage.svelte";
    let { data } = $props();

    const timers = new Map<number, number>();    
    function send(element:HTMLButtonElement, index: number, direction: string) {
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
</script>

<svelte:head>
    <link rel="stylesheet" href="/preview.css" />
</svelte:head>

<a class="landing" href="/">Menu</a>
<div class="PrintPages">
    <div id="first-page-reminder">
        <div
            style="width: 100%; height: 50px; border-left: 1px solid black; border-right: 1px solid black; border-top: 1px solid grey;"
        >
            <p style="color: red;">Make sure to set Margins in your print settings to None!</p>
        </div>
    </div>
    {#each data.pages as page, i}
        <DisplayPage>
            {@html page}
        </DisplayPage>
        <div class="PageBreakButtons">
            <button onclick={() => send(this, i, "up")}>↑↑↑↑</button>
            <small>(page break)</small>
            <button onclick={() => send(this, i, "down")}>↓↓↓↓</button>
        </div>
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