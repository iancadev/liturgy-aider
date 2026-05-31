// src/routes/+layout.server.ts

import type { LayoutServerLoad } from './$types';
import { copyRecursive, getStylesheets } from '$lib/server/file';
import path from 'node:path';


export const load: LayoutServerLoad = async () => {
    const sourceDir = path.resolve('../styles');
    const staticDir = path.resolve('static/project-styles');

    await copyRecursive(sourceDir, staticDir);

    const stylesheets = await getStylesheets(staticDir);

    return {
        stylesheets
    };
};