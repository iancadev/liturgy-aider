import * as cheerio from "cheerio";
import { copyAttributes } from "./utils";

export const processPretext = (html: string): string => {
    const $ = cheerio.load(html, {
        decodeEntities: false
    });

    $("pre").each((_, pre) => {
        const $pre = $(pre);

        const indentSize = Number($pre.attr("indent") ?? 2);

        const lines = $pre
            .text()
            .replace(/\r\n/g, "\n")
            .trim()
            .split("\n");

        const fragments: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (i > 0) {
                fragments.push("<br>");
            }

            const startsLowercase = /^[a-z]/.test(line);

            if (i > 0 && startsLowercase) {
                fragments.push("&nbsp;".repeat(indentSize));
            }

            fragments.push(line);
        }

        const $p = $('<p pre></p>');
        $p.html(fragments.join(""));
        copyAttributes($pre, $p, ["indent"]);
        $pre.replaceWith($p);
    });

    return $.html();
}