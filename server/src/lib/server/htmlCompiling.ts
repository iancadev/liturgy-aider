import * as cheerio from "cheerio";

const processTwoCols = (html: string): string => {
    const $ = cheerio.load(html, {
        decodeEntities: false
    });

    for (const attr of ["two-column", "two-column-divided"]) {
        $(`[${attr}]`).each((_, el) => {
            const $el = $(el);

            const tagName = el.tagName;

            const lines = $el
                .text()
                .replace(/\r\n/g, "\n")
                .split("\n");

            // Remove trailing blank lines only
            while (
                lines.length > 0 &&
                lines[lines.length - 1].trim() === ""
            ) {
                lines.pop();
            }

            const mid = Math.ceil(lines.length / 2);

            const leftText = lines.slice(0, mid).join("\n");
            const rightText = lines.slice(mid).join("\n");

            const container = $("<div></div>")
                .addClass(`${attr}-container`);

            const leftWrapper = $("<div></div>");
            const rightWrapper = $("<div></div>");

            const $left = $(`<${tagName}></${tagName}>`);
            const $right = $(`<${tagName}></${tagName}>`);

            // Copy all attributes except the column marker itself
            for (const [name, value] of Object.entries(el.attribs ?? {})) {
                if (name === attr) continue;

                $left.attr(name, value);
                $right.attr(name, value);
            }

            $left.text(leftText);
            $right.text(rightText);

            leftWrapper.append($left);
            rightWrapper.append($right);

            container.append(leftWrapper);
            if (attr === "two-column-divided") {
                container.append($('<div class="divider"></div>'))
            }
            container.append(rightWrapper);

            $el.replaceWith(container);
        });
    }

    return $.html();
};

const processPre = (html: string): string => {
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
        for (const [k, v] of Object.entries($pre.attr() ?? {})) {
            if (k === "indent") continue;
            $p.attr(k, v);
        }

        $pre.replaceWith($p);
    });

    return $.html();
}

const processScale = (html: string): string => {
    const $ = cheerio.load(html, {
        decodeEntities: false
    });

    $("[scale]").each((_, el) => {
        const $el = $(el);

        if (el.tagName === "img") {
            return;
        }

        const scale = Number($el.attr("scale"));

        if (!Number.isFinite(scale)) {
            return;
        }

        const innerHtml = $el.html() ?? "";

        $el.html(
            `<span style="font-size:${scale}em;">${innerHtml}</span>`
        );

        if (scale < 1) {
            const marginStyle = `line-height: ${scale}`;

            const existingStyle = $el.attr("style");
            $el.attr(
                "style",
                existingStyle
                    ? `${existingStyle.trim().replace(/;?$/, ";")} ${marginStyle};`
                    : `${marginStyle};`
            );
        }

        $el.removeAttr("scale");
    });

    return $.html();
};


export const compileHTML = (html: string): string => {
    html = processTwoCols(html);
    html = processPre(html);
    return processScale(html);
};