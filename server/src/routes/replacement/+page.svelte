<script lang="ts">
    let { data } = $props();

    let entries = $state({ ...data.fields });

    const textareas: Record<string, HTMLTextAreaElement> = {};

    const timers = new Map<string, number>();

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
</script>

<a class="landing" href="/">Menu</a>

<table>
    <tbody>
        {#each Object.entries(entries) as [key]}
            <tr>
                <td
                    onclick={() => {
                        textareas[key]?.focus();
                        textareas[key]?.select();
                    }}
                >
                    {key}
                </td>

                <td>
                    <textarea
                        data-key={key}
                        bind:this={textareas[key]}
                        bind:value={entries[key].value}
                        oninput={(e) => changeValue(key, e.currentTarget.value)}
                    ></textarea>
                </td>
            </tr>
        {/each}
    </tbody>
</table>

<style>
    textarea {
        field-sizing: content;
        min-height: 3lh;
        min-width: 10lh;
        resize: none;
        padding: 8px;
    }
</style>
