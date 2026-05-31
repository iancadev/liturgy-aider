// src/routes/+layout.server.ts

import type { LayoutServerLoad } from './$types';
import { copyRecursive, getStylesheets } from '$lib/server/file';
import path from 'node:path';
import { stylesDir } from '$lib/server/fileWatcher';


export const load: LayoutServerLoad = async ({ depends }) => {
    depends('watch:styles');

    const sourceDir = stylesDir;
    const staticDir = path.resolve('static/project-styles');

    await copyRecursive(sourceDir, staticDir);

    const stylesheets = await getStylesheets(staticDir);

    return {
        stylesheets,
        now: Date.now()
    };
};