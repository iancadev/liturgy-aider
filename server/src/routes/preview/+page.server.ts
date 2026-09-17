import type { PageServerLoad } from './$types';

import { checkSyntax, splitByPageBreaks } from '$lib/server/htmlProcessing';
import { compileHTMLFile } from '$lib/server/compile';

import * as cheerio from 'cheerio';
import { runInNewContext } from 'node:vm';


function loadLayoutConfig(html: string) {
    const $ = cheerio.load(html);
    const configScript = $('script#layout-config');

    if (configScript.length === 0) {
        return null;
    }

    const source = configScript.html();

    if (source === null) {
        return null;
    }

    return runInNewContext(`(${source})`);
}


export const load: PageServerLoad = async ({ cookies, depends }) => {
    depends('watch:html_file');

    const html_file = cookies.get('html_file');

    const html = await compileHTMLFile(html_file);

    const config = loadLayoutConfig(html);
    const { pages, normalSplits } = splitByPageBreaks(html);

    return {
        pages,
        normalSplits,
        syntaxErrors: checkSyntax(html),
        config
    };
};