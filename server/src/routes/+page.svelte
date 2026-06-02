<!--

Select the file you're working on (this updates a config file), then choose whether to enter replacement view or preview view

-->

<script lang="ts">
    import { invalidate } from "$app/navigation";

    let { data } = $props();

    let input_value = $state();
    let submitting = $state(false);

    let disabled = $derived.by(() => {
        return (
            submitting || !input_value || input_value == data.html_file
        );
    });

    async function submit() {
        submitting = true;
        const response = await fetch("/api/set-file", {
            method: "POST",
            body: JSON.stringify({ html_file: input_value }),
            headers: { "Content-Type": "application/json" },
        });
        if (response.status === 201) {
            invalidate("app:html_file");
        }
        submitting = false;
    }
</script>

<div
    style="background: white; margin-bottom: 40px; padding: 10px; border-bottom: 1px dashed grey;"
>
    <h3>Current html_file path: <i>{data.html_file}</i></h3>
    {#if data.warning}
        <p style="color: red">{data.warning}</p>
    {/if}
    <input bind:value={input_value} placeholder="new html_file path" />
    <button {disabled} onclick={() => submit()}>Set</button>
</div>

<div style="margin-bottom: 8px;">
    <a class="landing" href="/preview">Preview document</a>
    <a class="landing" href="/replacement">Manage text/images</a>
</div>

<a class="landing" href="/browser">Browse toolkit</a>
