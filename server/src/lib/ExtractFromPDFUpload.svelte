<script lang="ts">
    let { disabled } = $props();

    let fileInput: HTMLInputElement;
    let status = "";
    let uploading = false;

    async function handleFile(file: File | undefined) {
        if (!file) return;

        if (file.type !== "application/pdf") {
            status = "Please select a PDF file.";
            fileInput.value = "";
            return;
        }

        uploading = true;
        status = "Extracting images...";

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/extract-pdf-images", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error ?? "Extraction failed.");
            }

            status = `Extracted ${result.count} image${result.count === 1 ? "" : "s"}.`;
        } catch (error) {
            status = error instanceof Error
                ? error.message
                : "Extraction failed.";
        } finally {
            uploading = false;
            fileInput.value = "";
        }
    }

    function handleChange(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        handleFile(input.files?.[0]);
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();

        if (uploading) return;

        handleFile(event.dataTransfer?.files[0]);
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
    }
</script>

<p>{status}</p>

<div
    class="drop-zone"
    ondragover={handleDragOver}
    ondrop={handleDrop}
    role="form"
>
    <input
        bind:this={fileInput}
        type="file"
        accept="application/pdf,.pdf"
        disabled={uploading || disabled}
        onchange={handleChange}
    />

    {#if uploading}
        <p>Extracting images...</p>
    {:else}
        <p>Drag a PDF here or choose one.</p>
    {/if}
</div>

<style>
    .drop-zone {
        border: 2px dashed #aaa;
        padding: 2rem;
        text-align: center;
        float: left;
    }
</style>