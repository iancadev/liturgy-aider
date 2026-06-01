/*

Load the file

Identify all image src's and text variables, categorized by "is"

Send over as JSON

*/

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import { readFile } from 'node:fs/promises';
import { extractFields, checkSyntax } from '$lib/server/htmlProcessing';

export const load: PageServerLoad = async ({ cookies, depends }) => {
    depends("watch:html_file");

    const html_file = cookies.get('html_file');

    let html = await readFile(html_file, 'utf-8');

    const fieldJSON = await extractFields(html);

    return { fields: fieldJSON, syntaxErrors: checkSyntax(html) }
}