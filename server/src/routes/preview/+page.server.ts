import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import { readFile } from 'node:fs/promises';
import { resolveImgs, checkSyntax, splitByPageBreaks, imgAbsolutePaths } from '$lib/server/htmlProcessing';

import { compileHTML } from '$lib/server/htmlCompiling';
import { dirname } from '$lib/server/file';


export const load: PageServerLoad = async ({ cookies, depends }) => {
    depends("watch:html_file");

    const html_file = cookies.get('html_file');

    let html = await readFile(html_file, 'utf-8');
    const html_dir = dirname(html_file);

    html = await imgAbsolutePaths(html, html_dir);

    html = await compileHTML(html);

    html = await resolveImgs(html, html_dir);
    
    let { pages, normalSplits } = splitByPageBreaks(html);

    return { pages, normalSplits, syntaxErrors: checkSyntax(html) }
};