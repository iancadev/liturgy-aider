<script lang="ts">
    import DisplayPage from "../preview/DisplayPage.svelte";

    let { data } = $props();

    const groups = $derived.by(() => {
        return Object.entries(data.toolkit).sort(([a], [b]) =>
            a.localeCompare(b),
        );
    });

    async function copy(text: string) {
        await navigator.clipboard.writeText(text);
    }
</script>

<svelte:head>
    <link rel="stylesheet" href="/browser.css" />
</svelte:head>

<div class="layout">
    <aside>
        <a class="landing" href="/">Menu</a>
        {#each groups as [group]}
            <a href={"#" + group}>{group}</a>
        {/each}
    </aside>

    <main>
        <p id="infoofni">Click on the file name to copy the HTML file</p>
        {#each groups as [group, items]}
            <section id={group}>
                <h2>{group}</h2>

                {#each [...items].sort( (a, b) => a.fileName.localeCompare(b.fileName), ) as item}
                    <div class="item">
                        <button
                            class="item-header"
                            onclick={() => copy(item.htmlSnippet)}
                        >
                            {item.fileName}
                        </button>

                        <DisplayPage>
                            {@html item.htmlContent}
                        </DisplayPage>
                    </div>
                {/each}
            </section>
        {/each}
    </main>
</div>

<style>
    #infoofni {
        padding: 8px;
        border: 1px solid black;
        background: white;
        color: green;
        margin: 0;
    }

    .layout {
        display: flex;
        height: 100%;
    }

    aside {
        overflow-y: auto;
        padding: 1rem;
        border-right: 1px solid #ccc;

        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        background: #eee;

        overflow-y: auto;
    }

    main {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
    }

    section {
        margin: 1.5rem 0;
    }

    h2 {
        background: white;
        padding: 8px;
        margin: 0 0 8px 0;
    }

    .item {
        margin-bottom: 2rem;
        padding-left: 16px;
    }

    .item-header {
        padding: 0.5rem;
        border: 1px solid #ccc;
        cursor: pointer;
        user-select: none;
        width: 100%;

        text-align: left;
    }

    .item-content {
        padding: 0.5rem;
    }

    button {
        background: #eee;
    }
</style>
