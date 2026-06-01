<script lang="ts">
    let { data } = $props();

    let values = $state({ ...data.fields });

    const textareas: Record<string, HTMLTextAreaElement> = {};

    const timers = new Map<string, number>();

    $effect(() => {
        const active = document.activeElement;

        for (const [key, serverValue] of Object.entries(data.fields)) {
            if (textareas[key] !== active) {
                values[key] = serverValue;
            }
        }
    });

    function changeValue(target: string, value: string) {
        values[target] = value;

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
        {#each Object.entries(values) as [key]}
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
                        bind:value={values[key]}
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
