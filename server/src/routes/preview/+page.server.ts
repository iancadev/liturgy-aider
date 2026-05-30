/*

Load the file

Apply variants to the HTML

Watch for changes to the file and re-apply variants

*/

import type { PageServerLoad } from './$types';
import * as cheerio from 'cheerio';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isTiffSrc, convertTiffToPng } from '$lib/server/tiff';

const HTML_FILE = path.resolve('../current.html');


export const load: PageServerLoad = async () => {
    const html = await readFile(HTML_FILE, 'utf-8');

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

            const newSrc = await convertTiffToPng(src, HTML_FILE);

            $(img).attr('src', newSrc);
        })
    );

    return {
        html: $.html()
    };
};