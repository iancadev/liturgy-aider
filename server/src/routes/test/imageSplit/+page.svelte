<script lang="ts">
    let { data } = $props();
</script>

<div style="padding: 10px; border: 1px solid black;">
    <img src={data.whiteRegions} style="max-width: 80%; max-height: 50%;"/>
</div>

<div style="padding: 10px; border: 1px solid black;">
    <img src={data.detectedLines} style="max-width: 80%; max-height: 50%;"/>
</div>

<div style="padding: 10px; border: 1px solid black;">
    <img src={data.detectedGroups} style="max-width: 80%; max-height: 50%;"/>
</div>
