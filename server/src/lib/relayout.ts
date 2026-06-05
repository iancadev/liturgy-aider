import { get } from "svelte/store";
import { config } from "$lib/layout-config";

const CONFIG = get(config);

const Inches = 96;
const PAGE_WIDTH = 8.5 * Inches;
const PAGE_HEIGHT = 11 * Inches;
const Image_Font = 100;

export function relayout(page: HTMLElement, queueRelayout: ()=>null) {
    let {
        IDEAL_FONT,
        MIN_FONT,
        MAX_FONT,
        IDEAL_GAP,
        MIN_GAP,
        MAX_GAP,
        IDEAL_PADDING,
        MAX_PADDING,
        MIN_PADDING,
        PADDING_X,
    } = CONFIG;
    const MAX_WIDTH = PAGE_WIDTH - 2 * PADDING_X;


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

                    if (htmlImg.hasAttribute("deco")) continue;

                    if (!htmlImg.dataset.relayoutListener) {
                        htmlImg.dataset.relayoutListener = "1";

                        htmlImg.addEventListener("load", () => {
                            queueRelayout();
                        });
                    }

                    htmlImg.dataset.baseWidth = String(
                        htmlImg.naturalWidth || htmlImg.width,
                    );

                    const imageScaling =
                        htmlImg.getAttribute("scale") &&
                            !isNaN(htmlImg.getAttribute("scale"))
                            ? parseFloat(htmlImg.getAttribute("scale"))
                            : 1;

                    const _fontEstimate = htmlImg.getAttribute("fontEstimate");
                    let imageFont = _fontEstimate && !isNaN(_fontEstimate) ? parseFloat(_fontEstimate) : Image_Font;

                    const baseWidth = Number(htmlImg.dataset.baseWidth);
                    const desiredWidth =
                        (baseWidth * font * imageScaling) / imageFont;

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
