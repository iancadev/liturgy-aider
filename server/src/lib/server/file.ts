import path from 'node:path';
import fs from 'node:fs/promises';
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

async function removeCssRecursive(dir: string) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await removeCssRecursive(fullPath);
            } else if (entry.name.endsWith(".ltrg.css")) {
                await fs.unlink(fullPath);
            }
        }
    } catch {
        // Directory doesn't exist yet.
    }
}

export async function copyRecursive(src: string, dest: string) {
    await fs.mkdir(dest, { recursive: true });

    await removeCssRecursive(dest);

    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyRecursive(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

export async function getStylesheets(
    dir: string,
    root?: string
): Promise<string[]> {
    const result: string[] = [];

    if (!root) {
        return getStylesheets(dir, dir);
    }

    const entries = await fs.readdir(dir, {
        withFileTypes: true
    });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            result.push(...await getStylesheets(fullPath, root));
        } else if (
            entry.name.endsWith('.css')
        ) {
            const relative = path
                .relative(root, fullPath)
                .replaceAll('\\', '/');

            result.push(`/project-styles/${relative}`);
        }
    }

    return result;
}