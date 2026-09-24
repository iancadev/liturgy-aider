import * as cheerio from 'cheerio';
import * as path from "path";
import { cwd } from "node:process";
import { isTiffSrc, convertTiffToPng, serveLocal } from '$lib/server/tiff';
import { fileExists } from './file';


export const resolveAbsolutePath = async (html_dir: string, src: string): Promise<string | undefined> => {
    if (!src)
        return undefined;

    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("file://") || src.startsWith("data:")) {
        return undefined;
    }

    const filesystemPath = path.resolve(html_dir, src);

    if (!await fileExists(filesystemPath)) {
        return undefined;
    }

    return filesystemPath;
};


export const imgAbsolutePaths = async (
    html: string,
    html_dir: string
): Promise<string> => {
    const $ = cheerio.load(html);

    for (const el of $("img[src]").toArray()) {
        const src = $(el).attr("src");
        if (!src) continue;

        if (
            src.startsWith("http://") ||
            src.startsWith("https://") ||
            src.startsWith("file://") ||
            src.startsWith("data:")
        ) {
            continue;
        }

        const filesystemPath = path.resolve(html_dir, src);
        // const staticPath = path.resolve(cwd(), "static", src.replace(/^\/+/, ""));

        if (await fileExists(filesystemPath))
            $(el).attr("src", filesystemPath);
        // else if (await fileExists(staticPath))
        //    $(el).attr("src", staticPath);
        else
            $(el).attr("src", "https://placehold.co/600x400");
    }

    return $.html();
}


export const resolveImgSrc = async (
    src: string,
    html_dir: string
): Promise<string> => {
    if (
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("file://") ||
        src.startsWith("data:")
    ) {
        return src;
    }

    const filesystemPath = path.resolve(html_dir, src);

    if (await fileExists(filesystemPath)) {
        return filesystemPath;
    } else {
        return "https://placehold.co/600x400";
    }
}



export const resolveImgs = async (
    html: string,
    html_dir: string
): Promise<string> => {
    const $ = cheerio.load(html);

    for (const el of $("img[src]").toArray()) {
        let src = $(el).attr("src");
        if (!src) continue;

        // If the img already is online, we don't have to do anything
        if (
            src.startsWith("http://") ||
            src.startsWith("https://") ||
            src.startsWith("data:")
        ) {
            continue;
        }

        // If the img doesn't exist locally, there is nothing we can do.
        // if (src.startsWith("file://")) src = src.slice("file://".length);
        const absolutePath = path.resolve(html_dir, src);
        if (!await fileExists(absolutePath)) {
            $(el).attr("src", "https://placehold.co/599x399");
            continue;
        }

        // If the img is a .tif file, we need to convert it
        // Otherwise, we just need to put it in the static directory
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
    // check that modifiers are valid

    return [];
}




export const extractFields = async (html: string, html_dir: string): Promise<Record<string, any>> => {
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
    for (const el of $("div[is] *").toArray()) {
        if ($(el).attr("const") !== undefined) continue;
        const path = [
            ...$(el)
                .parents("[is]")
                .toArray()
                .reverse()
                .map(
                    (parent) =>
                        `${parent.tagName}[is="${$(parent).attr("is")}"]`
                ),
            $(el).attr("is") ? `${el.tagName}[is="${$(el).attr("is")}"]` : el.tagName
        ];

        let value: string | undefined;
        let preview: string | undefined;

        switch (el.tagName) {
            case "img":
                value = $(el).attr("src") ?? undefined;
                value = await resolveImgSrc(value, html_dir);
                if (value && isTiffSrc(value)) {
                    preview = await convertTiffToPng(value);
                } else {
                    preview = await serveLocal(value);
                }
                break;

            case "p":
            case "span":
            case "h1":
            case "h2":
            case "h3":
            case "h4":
            case "h5":
            case "h6":
            case "subtitle":
            case "pre":
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

export const splitByPageBreaks = (
    html: string
): {
    pages: string[];
    normalSplits: boolean[];
} => {
    const hrRegex = /(<hr\b[^>]*\/?>)/gi;

    const parts = html.split(hrRegex);

    const pages: string[] = [];
    const normalSplits: boolean[] = [];

    let current = parts[0] ?? "";

    for (let i = 1; i < parts.length; i += 2) {
        const hr = parts[i];
        const next = parts[i + 1] ?? "";

        pages.push(current);

        normalSplits.push(!/\bimageBreak\b/i.test(hr));

        current = next;
    }

    pages.push(current);

    return {
        pages,
        normalSplits
    };
};