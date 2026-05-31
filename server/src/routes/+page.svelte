<!--

Select the file you're working on (this updates a config file), then choose whether to enter replacement view or preview view

-->

<script lang="ts">
    let { data } = $props();
</script>


<h3>Set the html_file path to <i>{ data.html_file }</i></h3>

<a href="/preview">Preview document</a>
<a href="/replacement">Manage text/images</a>