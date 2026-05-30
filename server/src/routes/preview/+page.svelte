<script lang="ts">
    // import { PageProps } from './$types';

/*
    Now that we're on DOM, you can use DOM features to test rescaling live.

    The server will have loaded the HTML with variants applied.
*/
    let { data } = $props();
</script>

{@html data.html}