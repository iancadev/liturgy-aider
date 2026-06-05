import type { Cheerio } from "cheerio";

export const copyAttributes = (
    $el0: Cheerio<Element>,
    $el1: Cheerio<Element>,
    exclude: string[] = []
) => {
    for (const [name, value] of Object.entries($el0.get(0)?.attribs ?? {})) {
        if (exclude.includes(name)) continue;

        $el1.attr(name, value);
    }
};