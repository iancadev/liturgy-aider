import path from 'node:path';
import { access } from 'node:fs/promises';

export function srcToLocalPath(src: string, HTML_FILE?: string): string {
    // Example:
    // <img src="/images/foo.tif">
    // resolves to static/images/foo.tif
    if (src.startsWith('/')) {
        return path.resolve('static', src.slice(1));
    }

    // Example:
    // <img src="./foo.tif">
    // resolves relative to the HTML file
    if (HTML_FILE) {
        return path.resolve(path.dirname(HTML_FILE), src);
    }

    return "https://placehold.co/600x400"
}

export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}