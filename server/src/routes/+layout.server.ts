// src/routes/+layout.server.ts

import type { LayoutServerLoad } from './$types';
import { copyRecursive, dirExists, fileExists, getStylesheets } from '$lib/server/file';
import path from 'node:path';


export const load: LayoutServerLoad = async ({ cookies, depends }) => {
    depends('watch:styles');
    depends('app:html_file');

    const staticDir = path.resolve('static/project-styles');

    const html_file = cookies.get('html_file');

    if (html_file && !await fileExists(html_file)) {
        cookies.set('html_file', '', { path: '/' });
    } else if (html_file) {
        console.log(html_file, path.dirname(html_file))
        const sourceDir = path.join(path.dirname(html_file), 'styles');
        if (await dirExists(sourceDir)) await copyRecursive(sourceDir, staticDir);
    }

    const stylesheets = await getStylesheets(staticDir);

    return {
        stylesheets,
        now: Date.now(),
        html_file: cookies.get('html_file')
    };
};