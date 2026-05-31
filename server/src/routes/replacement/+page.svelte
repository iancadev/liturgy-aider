<script lang="ts">
    /* render the list of texts and src's, with tabs to select */

    let { data } = $props();
</script>

<a class="landing" href="/">Menu</a>
<table>
    {#each Object.entries(data.fields) as field}
        <tr>
            <td>{field[0]}</td><td>{field[1]}</td>
        </tr>
    {/each}
</table>
