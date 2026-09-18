import { get } from "svelte/store";
const INCH = 96;
const PAGE_WIDTH = 8.5 * INCH;
const PAGE_HEIGHT = 11 * INCH;
const IMAGE_FONT = 100;

export function relayout(
    page: HTMLElement,
    CONFIG,
    queueRelayout: () => null
) {
    console.log(CONFIG);
    if (!page) return;

    const items = Array.from(page.children) as HTMLElement[];
    if (!items.length) return;

    const MAX_WIDTH = PAGE_WIDTH - 2 * CONFIG.PADDING_X;

    let font = CONFIG.IDEAL_FONT;

    function getGap() {
        return CONFIG.IDEAL_GAP + CONFIG.GAP_SCALE * font;
    }

    function apply() {
        page.style.setProperty(
            "--page-gap",
            `${getGap()}px`
        );

        page.style.setProperty(
            "--page-padding",
            `${CONFIG.PADDING_Y}px`
        );

        page.style.paddingLeft = `${CONFIG.PADDING_X}px`;
        page.style.paddingRight = `${CONFIG.PADDING_X}px`;

        for (const el of items) {
            if (!el.hasAttribute("is")) continue;

            el.style.fontSize = `${font}px`;

            for (const img of el.querySelectorAll("img")) {
                const image = img as HTMLImageElement;

                // if (image.hasAttribute("deco")) continue;

                if (!image.dataset.relayoutListener) {
                    image.dataset.relayoutListener = "1";

                    image.addEventListener("load", () => {
                        queueRelayout();
                    });
                }

                const baseWidth =
                    image.naturalWidth || image.width;

                const scale =
                    Number(image.getAttribute("scale")) || 1;

                const fontEstimate =
                    Number(image.getAttribute("fontEstimate")) ||
                    IMAGE_FONT;

                const desiredWidth =
                    0.7 *
                    (baseWidth * font * scale) /
                    fontEstimate;

                image.style.width = `${Math.min(
                    desiredWidth,
                    MAX_WIDTH
                )}px`;

                image.style.height = "auto";
            }
        }
    }

    function getHeight() {
        return (
            items.reduce(
                (sum, el) =>
                    sum + el.getBoundingClientRect().height,
                0
            ) +
            2 * CONFIG.PADDING_Y +
            (items.length - 1) * getGap()
        );
    }

    function getLeafNodes(root: HTMLElement): HTMLElement[] {
        const children = Array.from(root.children) as HTMLElement[];
        if (
            root.tagName === "SCRIPT" ||
            root.tagName === "STYLE"
        ) {
            return [];
        }

        if (children.length === 0) {
            return [root];
        }

        return children.flatMap(getLeafNodes);
    }

    function fitsVertically() {
        const pageRect = page.getBoundingClientRect();

        const top = pageRect.top + CONFIG.PADDING_Y;
        const bottom = pageRect.bottom - CONFIG.PADDING_Y;

        return items
            .flatMap(getLeafNodes)
            .every(el => {
                const rect = el.getBoundingClientRect();

                const fits =
                    rect.top >= top &&
                    rect.bottom <= bottom;

                if (!fits) {
                    console.log("VERTICAL FAIL", {
                        el,
                        top,
                        bottom,
                        elementTop: rect.top,
                        elementBottom: rect.bottom
                    });
                }

                return fits;
            });
    }

    function fitsHorizontally() {
        const pageRect = page.getBoundingClientRect();

        const left = pageRect.left + CONFIG.PADDING_X;
        const right = pageRect.right - CONFIG.PADDING_X;

        return items
            .flatMap(getLeafNodes)
            .every(el => {
                const rect = el.getBoundingClientRect();

                const fits =
                    rect.left >= left &&
                    rect.right <= right;

                if (!fits) {
                    console.log("HORIZONTAL FAIL", {
                        el,
                        left,
                        right,
                        elementLeft: rect.left,
                        elementRight: rect.right
                    });
                }

                return fits;
            });
    }

    function fits() {
        apply();

        return fitsVertically() && fitsHorizontally();
    }


    // First find a font size that fits.
    while (
        font > CONFIG.MIN_FONT &&
        !fits()
    ) {
        font -= 0.25;
    }

    // Then increase the font as much as possible
    // without violating either constraint.
    while (font < CONFIG.MAX_FONT) {
        font += 0.25;

        if (!fits()) {
            font -= 0.25;
            break;
        }
    }

    apply();
}
