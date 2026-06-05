import * as cheerio from "cheerio";
import { copyAttributes } from "./utils";

const splitText = (text: string, splits: number = 2): string[] => {
    let lines = text.replace(/\r\n/g, "\n").split("\n");

    // Remove trailing blank lines only
    while (
        lines.length > 0 &&
        lines[lines.length - 1].trim() === ""
    ) {
        lines.pop();
    }

    if (splits <= 1 || lines.length === 0) {
        return [lines.join("\n")];
    }

    // Separator candidates: lines that are exactly "---"
    const separatorIndices = lines
        .map((line, i) => ({
            line: line.trim(),
            i
        }))
        .filter(x => x.line === "---")
        .map(x => x.i);

    // Use at most splits - 1 separators
    if (separatorIndices.length > 0) {
        // Choose separators spread across the document
        const chosen: number[] = [];

        for (let k = 1; k < splits; k++) {
            const target =
                (k * separatorIndices.length) / splits;

            const idx =
                separatorIndices[
                Math.min(
                    separatorIndices.length - 1,
                    Math.floor(target)
                )
                ];

            if (!chosen.includes(idx)) {
                chosen.push(idx);
            }
        }

        chosen.sort((a, b) => a - b);

        const out: string[] = [];

        let start = 0;

        for (const sep of chosen) {
            out.push(lines.slice(start, sep).join("\n"));
            start = sep + 1; // skip separator
        }

        out.push(lines.slice(start).join("\n"));

        return out;
    }

    // Fallback: split approximately evenly by line count
    const out: string[] = [];

    for (let i = 0; i < splits; i++) {
        const start = Math.floor((i * lines.length) / splits);
        const end = Math.floor(((i + 1) * lines.length) / splits);

        out.push(lines.slice(start, end).join("\n"));
    }

    return out;
};

const excludedAttributes = [
    `two-column`,
    `two-column-divided`,
    `three-column`,
    `three-column-divided`,
    `four-column`,
    `four-column-divided`,
]
const divideEl = ($, $el: cheerio.Cheerio<Element>, splits: number = 2, divider: boolean = false): cheerio.Cheerio<Element> => {
    const texts = splitText($el.text(), splits);
    const tagName = $el.get(0)?.tagName;

    const container = $("<div></div>")
        .addClass(divider ?
            `n-column-divided-container` : `n-column-container`
        );

    for (let i = 0; i < splits; i++) {
        const $frag = $(`<${tagName}></${tagName}>`);
        $frag.text(texts[i]);
        copyAttributes($el, $frag, excludedAttributes);

        const wrapper = $("<div></div>");
        wrapper.append($frag);
        container.append(wrapper);
        if (divider) container.append($('<div class="divider"></div>'));
    }

    $el.replaceWith(container);
};


export const processCols = (html: string): string => {
    const $ = cheerio.load(html, {
        decodeEntities: false
    });

    for (const attr of ["two-column", "two-column-divided"]) {
        $(`[${attr}]`).each((_, el) => {
            const $el = $(el);
            divideEl($, $el, 2, attr.endsWith("-divided"));
        });
    }

    for (const attr of ["three-column", "three-column-divided"]) {
        $(`[${attr}]`).each((_, el) => {
            const $el = $(el);
            divideEl($, $el, 3, attr.endsWith("-divided"));
        });
    }

    for (const attr of ["four-column", "four-column-divided"]) {
        $(`[${attr}]`).each((_, el) => {
            const $el = $(el);
            divideEl($, $el, 4, attr.endsWith("-divided"));
        });
    }

    return $.html();
};