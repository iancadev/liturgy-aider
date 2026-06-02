import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import { readFile } from 'node:fs/promises';
import { resolveImgs, checkSyntax, splitByPageBreaks } from '$lib/server/htmlProcessing';

import { compileHTML } from '$lib/server/htmlCompiling';


export const load: PageServerLoad = async ({ cookies, depends }) => {
    depends("watch:html_file");

    const html_file = cookies.get('html_file');

    let html = await readFile(html_file, 'utf-8');

    html = await compileHTML(html);

    html = await resolveImgs(html, html_file);
    let { pages, normalSplits } = splitByPageBreaks(html);

    return { pages, normalSplits, syntaxErrors: checkSyntax(html) }
};