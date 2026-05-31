<script lang="ts">
    // import { PageProps } from './$types';
    import DisplayPage from "./DisplayPage.svelte";

    /*
    Now that we're on DOM, you can use DOM features to test rescaling live.

    The server will have loaded the HTML with variants applied.
*/
    let { data } = $props();
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
    <DisplayPage>
        {@html data.html}
    </DisplayPage>
</div>
