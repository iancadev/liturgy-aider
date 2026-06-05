import { estimateFont } from "$lib/server/splitImage";
import * as cheerio from "cheerio";


export async function estimateFontHeights(html: string): Promise<string> {
    const $ = cheerio.load(html, {
        decodeEntities: false
    });

    const images = $("img:not([deco])").toArray();

    for (const img of images) {
        const $img = $(img);

        const src = $img.attr("src");

        if (!src) {
            continue;
        }

        const root = $img.parents("div[is]").first();

        if (!root.length) {
            continue;
        }

        const fontEstimate = await estimateFont(src);
        $img.attr('fontEstimate', `${fontEstimate}`);
    }

    return $.html()
}