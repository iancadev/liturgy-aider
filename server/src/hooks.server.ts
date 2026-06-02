// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { fileExists } from '$lib/server/file';

export const handle: Handle = async ({ event, resolve }) => {
    const { pathname } = event.url;

    // allow public root route
    if (pathname === '/' || pathname.startsWith('/browser') || pathname.startsWith('/api')) {
        return resolve(event);
    }

    const htmlFile = event.cookies.get('html_file');

    if (!htmlFile) {
        throw redirect(303, '/');
    }

    const exists = await fileExists(htmlFile);

    if (!exists) {
        throw redirect(303, '/');
    }

    return resolve(event);
};