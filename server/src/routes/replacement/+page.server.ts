/*

Load the file

Identify all image src's and text variables, categorized by "is"

Send over as JSON

*/

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { dirname } from '$lib/server/file';

import { readFile } from 'node:fs/promises';
import { extractFields, checkSyntax } from '$lib/server/htmlProcessing';

export const load: PageServerLoad = async ({ cookies, depends }) => {
    depends("watch:html_file");

    const html_file = cookies.get('html_file');

    let html = await readFile(html_file, 'utf-8');

    const html_dir = dirname(html_file);
    const fieldJSON = await extractFields(html, html_dir);

    return { fields: fieldJSON, syntaxErrors: checkSyntax(html) }
}