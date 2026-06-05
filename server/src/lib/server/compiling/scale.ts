import * as cheerio from "cheerio";

export const processScale = ($: cheerio.CheerioAPI) => {
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
};