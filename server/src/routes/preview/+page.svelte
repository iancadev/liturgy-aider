<script lang="ts">
    // import { PageProps } from './$types';
    import DisplayPage from './DisplayPage.svelte';

/*
    Now that we're on DOM, you can use DOM features to test rescaling live.

    The server will have loaded the HTML with variants applied.
*/
    let { data } = $props();
</script>

<DisplayPage>
    {@html data.html}
</DisplayPage>