import * as cheerio from 'cheerio';
import * as path from "path";
import { isTiffSrc, convertTiffToPng, serveLocal } from '$lib/server/tiff';


export const resolveImgs = async (
    html: string,
    html_file: string
): Promise<string> => {
    const $ = cheerio.load(html);

    const htmlDir = path.dirname(html_file);

    for (const el of $("img[src]").toArray()) {
        const src = $(el).attr("src");
        if (!src) continue;

        // Skip already-absolute URLs and data URIs
        if (
            src.startsWith("http://") ||
            src.startsWith("https://") ||
            src.startsWith("file://") ||
            src.startsWith("data:")
        ) {
            continue;
        }

        const absolutePath = path.resolve(htmlDir, src);

        if (isTiffSrc(absolutePath)) {
            const newSrc = await convertTiffToPng(absolutePath);
            $(el).attr("src", newSrc);
            $(el).attr("wasTiff", 'true')
        } else {
            const newSrc = await serveLocal(absolutePath)
            $(el).attr("src", newSrc);
        }
    }

    return $.html();
};



export const checkSyntax = async (html: string): Promise<string[]> => {
    // check that every element has an is
    // check attributes are spelled correctly/are valid
    // check that variants are valid

    return [];
}


export const extractFields = async (html: string): Promise<Record<string, any>> => {
    const $ = cheerio.load(html);

    const fields: Record<string, any> = {};

    function setNestedValue(
        obj: Record<string, any>,
        path: string[],
        value: string
    ) {
        let current = obj;

        for (let i = 0; i < path.length - 1; i++) {
            if (!(path[i] in current)) {
                current[path[i]] = {};
            }
            current = current[path[i]];
        }

        current[path[path.length - 1]] = value;
    }

    // Extract text fields
    for (const el of $("[is]").toArray()) {
        const path = [
            ...$(el)
                .parents("[is]")
                .toArray()
                .reverse()
                .map(
                    (parent) =>
                        `${parent.tagName}[is="${$(parent).attr("is")}"]`
                ),
            `${el.tagName}[is="${$(el).attr("is")}"]`
        ];

        let value: string | undefined;
        let preview: string | undefined;
        
        switch (el.tagName) {
            case "img":
                value = $(el).attr("src") ?? undefined;
                if (value && isTiffSrc(value)) {
                    preview = await convertTiffToPng(value);
                } else {
                    preview = value;
                }
                break;

            case "script": {
                const content = $(el).html() ?? "";
                const match = content.match(
                    /\btext\s*=\s*`([\s\S]*?)`/
                );
                value = match?.[1];
                break;
            }

            case "p":
            case "span":
            case "h1":
            case "h2":
            case "h3":
            case "h4":
            case "h5":
            case "h6":
                value = $(el)
                    .contents()
                    .toArray()
                    .filter(node => node.type === "text")
                    .map(node => node.data)
                    .join("");
                break;
        }

        if (value) {
            fields[path.join(" ")] = { value, preview };
            // setNestedValue(fields, path, value);
        }
    }

    return fields;
};