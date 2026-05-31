/*

Load the file

Apply variants to the HTML

Watch for changes to the file and re-apply variants

*/

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import { readFile } from 'node:fs/promises';
import { replaceTiffImages, checkSyntax } from '$lib/server/htmlProcessing';


export const load: PageServerLoad = async ({ cookies, depends }) => {
    depends("watch:html_file");

    if (!cookies.get('html_file')) redirect(303, '/');
    const html_file = cookies.get('html_file');

    let html = await readFile(html_file, 'utf-8');

    html = await replaceTiffImages(html);

    return { html, syntaxErrors: checkSyntax(html) }
};