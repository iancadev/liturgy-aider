import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import { resolveImgs, checkSyntax, splitByPageBreaks, imgAbsolutePaths } from '$lib/server/htmlProcessing';

import { compileHTMLFile } from '$lib/server/compile';


export const load: PageServerLoad = async ({ cookies, depends }) => {
    depends("watch:html_file");

    const html_file = cookies.get('html_file');

    const html = await compileHTMLFile(html_file);
    
    let { pages, normalSplits } = splitByPageBreaks(html);

    return { pages, normalSplits, syntaxErrors: checkSyntax(html) }
};