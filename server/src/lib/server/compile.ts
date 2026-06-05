import * as cheerio from "cheerio";
import { readFile } from 'node:fs/promises';
import { dirname } from '$lib/server/file';

import { splitImage } from "$lib/server/splitImage";
import { imgAbsolutePaths, resolveImgs } from "./htmlProcessing";

import { processCols } from "./compiling/columns";
import { processPretext } from "./compiling/pretext";
import { processScale } from "./compiling/scale";
import { estimateFontHeights } from "./compiling/fontEstimates";
import { splitImages } from "./compiling/imageSplits";
import { autofillContent } from "./compiling/autofill";


export const compileHTML = async (html: string): Promise<string> => {
    // to-do: use Cheerio to decode only once.
    html = processCols(html);
    html = processPretext(html);
    html = await estimateFontHeights(html);
    html = await splitImages(html);
    html = autofillContent(html);
    return processScale(html);
};

export const compileHTMLFile = async (html_file: string): Promise<string> => {
    let html = await readFile(html_file, 'utf-8');
    const html_dir = dirname(html_file);

    html = await imgAbsolutePaths(html, html_dir);

    html = await compileHTML(html);

    html = await resolveImgs(html, html_dir);

    return html
}