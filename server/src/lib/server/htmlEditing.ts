import fs from "fs/promises";
import * as cheerio from "cheerio";

function format(html: string): string {
    return html.replace('<html><head></head><body>', '').replace('</body></html>', '')
}

export async function editHtmlText(
    filePath: string,
    selector: string,
    newText: string,
    index = 0
) {
    const html = await fs.readFile(filePath, "utf-8");
    const $ = cheerio.load(html);

    const elements = $(selector);

    if (elements.length === 0) {
        throw new Error(`No elements found for selector: ${selector}`);
    }

    if (index < 0 || index >= elements.length) {
        throw new Error(
            `Index ${index} out of bounds. Found ${elements.length} elements.`
        );
    }

    const el = elements.eq(index);

    el.contents().filter((_, node) => node.type === "text").remove();
    el.append(newText);

    await fs.writeFile(filePath, format($.html()), "utf-8");
}