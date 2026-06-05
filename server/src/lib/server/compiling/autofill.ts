import * as cheerio from "cheerio";

export const autofillContent = ($: cheerio.CheerioAPI) => {
    function setNodesIfBlank(
        nodes: cheerio.Cheerio<any>,
        text: string
    ) {
        nodes.each((_, el) => {
            const $el = $(el);

            // Check visible text content
            const current = $el.text().trim();

            // Only fill if blank
            if (!current) {
                $el.text(text);
            }
        });
    }

    // (text element)[is="HNJ"] => `HNJ`
    setNodesIfBlank($(`[is="HNJ"]`), "Holy Name of Jesus - St. Gregory the Great Church - 96th St. and Amsterdam, NYC");

    // (text element)[is="LICENSE"] => `Here's your license`
    setNodesIfBlank(
        $(`[is="LICENSE"]`),
        "Hymns and responses reprinted with permission under OneLicense.net A-725664"
    );
};