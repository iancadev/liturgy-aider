<script lang="ts">
    import { onMount } from "svelte";

    let { children } = $props();

    let page: HTMLDivElement;

    const Inches = 96; // pixels
    const Image_Font = 100; // height of text in pixels

    const PAGE_WIDTH = 8.5 * Inches;
    const PAGE_HEIGHT = 11 * Inches;
    const MAX_WIDTH = PAGE_WIDTH - 2 * 0.2 * Inches;

    const IDEAL_FONT = 12;
    const MIN_FONT = 8;
    const MAX_FONT = 16;

    const IDEAL_PADDING = 1 * Inches;
    const MIN_PADDING = 0.4 * Inches;
    const MAX_PADDING = 2 * Inches;

    const IDEAL_GAP = 0.2 * Inches;
    const MIN_GAP = 0.05 * Inches;
    const MAX_GAP = 2 * Inches;

    function relayout() {
        if (!page) return;

        const items = Array.from(page.children) as HTMLElement[];

        if (items.length === 0) return;

        let font = IDEAL_FONT;
        let padding = IDEAL_PADDING;
        let gap = IDEAL_GAP;

        function apply() {
            page.style.setProperty("--page-gap", `${gap}px`);
            page.style.setProperty("--page-padding", `${padding}px`);

            for (const el of items) {
                if (el.hasAttribute("is")) {
                    el.style.fontSize = `${font}px`;

                    for (const img of el.querySelectorAll("img")) {
                        const htmlImg = img as HTMLImageElement;
                        htmlImg.addEventListener("load", () => {
                            requestAnimationFrame(relayout);
                        });

                        htmlImg.dataset.baseWidth = String(
                            htmlImg.naturalWidth || htmlImg.width,
                        );

                        const imageFont = (el.hasAttribute("font")) ? parseFloat(el.getAttribute("font")) : Image_Font;

                        const baseWidth = Number(htmlImg.dataset.baseWidth);
                        const desiredWidth = baseWidth * font / imageFont;

                        htmlImg.style.width = `${Math.min(desiredWidth, MAX_WIDTH)}px`;
                        htmlImg.style.height = "auto";
                    }
                }
            }
        }

        function measureHeight() {
            apply();

            return (
                items.reduce(
                    (sum, el) => sum + el.getBoundingClientRect().height,
                    0,
                ) +
                2 * padding +
                (items.length - 1) * gap
            );
        }

        let h = measureHeight();

        // overflow
        while (h > PAGE_HEIGHT) {
            if (gap > MIN_GAP) {
                gap -= 1;
            } else if (padding > MIN_PADDING) {
                padding -= 1;
            } else if (font > MIN_FONT) {
                font -= 0.25;
            } else {
                break;
            }

            h = measureHeight();
        }

        // underflow
        while (h < PAGE_HEIGHT) {
            if (font < IDEAL_FONT) {
                font += 0.25;
            } else if (padding < IDEAL_PADDING) {
                padding += 1;
            } else if (gap < IDEAL_GAP) {
                gap += 1;
            } else {
                break;
            }

            const next = measureHeight();

            if (next > PAGE_HEIGHT) break;

            h = next;
        }

        apply();
    }

    onMount(() => {
        const mo = new MutationObserver(() => {
            requestAnimationFrame(relayout);
        });

        mo.observe(page, {
            childList: true,
            subtree: true,
        });

        requestAnimationFrame(relayout);

        return () => mo.disconnect();
    });
</script>

<div class="DisplayPage" bind:this={page}>
    {@render children()}
</div>

<style>
    .DisplayPage {
        gap: var(--page-gap);
        padding-top: var(--page-padding);
        padding-bottom: var(--page-padding);
        box-sizing: border-box;
    }
</style>
