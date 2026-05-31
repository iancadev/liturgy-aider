<script lang="ts">
    /* render the list of texts and src's, with tabs to select */

    let { data } = $props();

    function changeValue(target: string, value: string) {}
</script>

<a class="landing" href="/">Menu</a>
<table>
    {#each Object.entries(data.fields) as field}
        <tr>
            <td>{field[0]}</td><td
                ><textarea
                    value={field[1]}
                    oninput={(e) => changeValue(field[0], e.target.value)}
                ></textarea></td
            >
        </tr>
    {/each}
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