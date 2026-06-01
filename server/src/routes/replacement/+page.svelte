<script lang="ts">
    let { data } = $props();

    let entries = $state({ ...data.fields });

    const textareas: Record<string, HTMLTextAreaElement> = {};

    const timers = new Map<string, number>();

    let Stack: HTMLDivElement;

    $effect(() => {
        const active = document.activeElement;

        // Remove deleted fields
        for (const key of Object.keys(entries)) {
            if (!(key in data.fields)) {
                delete entries[key];
            }
        }

        // Add/update existing fields
        for (const [key, serverEntry] of Object.entries(data.fields)) {
            if (!(key in entries)) {
                entries[key] = { ...serverEntry };
                continue;
            }

            if (textareas[key] !== active) {
                entries[key].value = serverEntry.value;
            }

            entries[key].preview = serverEntry.preview;
        }
    });

    function changeValue(target: string, value: string) {
        entries[target].value = value;

        clearTimeout(timers.get(target));

        timers.set(
            target,
            window.setTimeout(() => {
                fetch("/api/update-html", {
                    method: "POST",
                    body: JSON.stringify({ target, value }),
                    headers: { "Content-Type": "application/json" },
                });
            }, 300),
        );
    }

    type Filter =
        | { type: "all" }
        | { type: "container"; is: string }
        | { type: "element"; tag: "img" | "pre" | "text" }
        | { type: "text"; is: string };

    let filter = $state<Filter>({ type: "all" });

    const filterOptions = $derived.by(() => {
        const containers = new Set<string>();
        const specialElements = new Set<string>(["img", "pre", "text"]);
        const textElements = new Set<string>();

        for (const key of Object.keys(entries)) {
            // top-level div[is=...]
            const divMatch = key.match(/^div\[is="([^"]+)"\]/);
            if (divMatch) {
                containers.add(divMatch[1]);
            }

            // text elements
            for (const match of key.matchAll(
                /(p|h1|h2|h3|h4|h5|h6|span)\[is="([^"]+)"\]/g,
            )) {
                textElements.add(match[2]);
            }
        }

        return {
            containers: [...containers].sort(),
            specialElements: [...specialElements].sort(),
            textElements: [...textElements].sort(),
        };
    });

    const numOptions = $derived.by(() => {
        return (
            4 +
            filterOptions.containers.length +
            filterOptions.specialElements.length +
            filterOptions.textElements.length
        );
    });

    const maxHeight = $derived.by(() => {
        if (filter.type === "element" && filter.tag == "img") return 400;
        return 200;
    });

    const visibleEntries = $derived.by(() => {
        return Object.entries(entries).filter(([key]) => {
            if (filter.type === "all") {
                return true;
            }

            if (filter.type === "container") {
                return key.startsWith(`div[is="${filter.is}"]`);
            }

            if (filter.type === "element") {
                if (filter.tag == "img")
                    return /img\[is="([^"]+)"\]/g.test(key);
                if (filter.tag == "pre")
                    return /pre\[is="([^"]+)"\]/g.test(key);
                return /(?:p|h1|h2|h3|h4|h5|h6|span)\[is="([^"]+)"\]/g.test(
                    key,
                );
            }

            if (filter.type === "text") {
                return (
                    /(?:p|h1|h2|h3|h4|h5|h6|span)\[is="([^"]+)"\]/g.test(key) &&
                    key.includes(`[is="${filter.is}"]`)
                );
            }

            return true;
        });
    });

    function format(key: string) {
        return key.replace(" ", "<br/>&nbsp;&nbsp;");
    }
</script>

<div class="Stack">
    <a class="landing" href="/">Menu</a>

    <div class="View">
        <select
            onchange={(e) => {
                const value = e.currentTarget.value;

                if (value === "all") {
                    filter = { type: "all" };
                } else if (value.startsWith("container:")) {
                    filter = {
                        type: "container",
                        is: value.slice("container:".length),
                    };
                } else if (value.startsWith("special:")) {
                    const [tag, is] = value.slice("special:".length).split(":");

                    filter = {
                        type: "element",
                        tag: tag as "img" | "pre",
                        is,
                    };
                } else if (value.startsWith("text:")) {
                    filter = {
                        type: "text",
                        is: value.slice("text:".length),
                    };
                }
            }}
            multiple
        >
            <option value="all">All</option>

            <optgroup label="Sections">
                {#each filterOptions.containers as is}
                    <option value={"container:" + is}>
                        div[{is}]
                    </option>
                {/each}
            </optgroup>

            <optgroup label="Images / Pre">
                {#each filterOptions.specialElements as item}
                    {@const [tag, is] = item.split(":")}
                    <option value={"special:" + item}>
                        {tag}[{is}]
                    </option>
                {/each}
            </optgroup>

            <optgroup label="Text">
                {#each filterOptions.textElements as is}
                    <option value={"text:" + is}>
                        text[{is}]
                    </option>
                {/each}
            </optgroup>
        </select>

        <div class="Scrolling">
            <table>
                <tbody>
                    {#each visibleEntries as [key]}
                        <tr>
                            <td
                                onclick={() => {
                                    textareas[key]?.focus();
                                    textareas[key]?.select();
                                }}
                            >
                                {@html format(key)}
                            </td>

                            <td>
                                {#if entries[key].preview}
                                    <img
                                        src={entries[key].preview}
                                        style="max-height: {maxHeight}px"
                                    /> <br />
                                {/if}
                                <textarea
                                    data-key={key}
                                    bind:this={textareas[key]}
                                    bind:value={entries[key].value}
                                    oninput={(e) =>
                                        changeValue(key, e.currentTarget.value)}
                                ></textarea>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>

<style>
    textarea {
        field-sizing: content;
        min-height: 1lh;
        min-width: 10lh;
        resize: none;
        padding: 8px;
        font-size: 14px;
    }

    .Stack {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        height: 100%;
        max-height: 100%;
    }

    .Stack a {
        float: left;
    }

    .View {
        display: flex;
        gap: 8px;
        flex-grow: 1;
        align-items: flex-start;
        min-height: 0;
        min-width: 80%;
    }

    .View > select, .View > div {
        overflow-y: auto;
        height: 100%;
    }

    .View > div, .View table {
        width: 100%;
        flex-grow: 1;
    }

    table b {
        font-size: 2em;
    }

    tr:nth-child(even) {
        background: #ddd;
    }
    tr:nth-child(odd) {
        background: #fff;
    }

    td {
        padding: 16px 8px;
    }
    td:nth-child(1) {
        font-size: 20px;
    }
</style>
