import * as cheerio from 'cheerio';
import { isTiffSrc, convertTiffToPng } from '$lib/server/tiff';

export const replaceTiffImages = async (html: string): Promise<string> => {
    const $ = cheerio.load(html);

    const tiffImages = $('img')
        .toArray()
        .filter((img) => {
            const src = $(img).attr('src');
            return src && isTiffSrc(src);
        });

    await Promise.all(
        tiffImages.map(async (img) => {
            const src = $(img).attr('src');
            if (!src) return;

            const newSrc = await convertTiffToPng(src);

            $(img).attr('src', newSrc);
            $(img).attr('wasTiff', 'true');
        })
    );

    return $.html();
}


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
    $("[is]").each((_, el) => {
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
        console.log(el.tagName);

        switch (el.tagName) {
            case "img":
                value = $(el).attr("src") ?? undefined;
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
                    .join("")
                    .trim();
                break;
        }

        if (value) {
            fields[path.join(" ")] = value;
            // setNestedValue(fields, path, value);
        }
    });

    return fields;
};