import path from 'node:path';
import fs from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { compileHTML } from './compile';

export function dirname(src: string): string {
    return path.dirname(src);
}


export function srcToLocalPath(src: string, HTML_DIR?: string): string {
    // Example:
    // <img src="/images/foo.tif">
    // resolves to static/images/foo.tif
    if (src.startsWith('/')) {
        return path.resolve('static', src.slice(1));
    }

    // Example:
    // <img src="./foo.tif">
    // resolves relative to the HTML file
    if (HTML_DIR) {
        return path.resolve(HTML_DIR, src);
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


type ToolkitFile = {
    fileName: string;
    htmlContent: string;
    htmlSnippet: string;
};

async function findHtmlFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    const results: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            results.push(...await findHtmlFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(".html")) {
            results.push(fullPath);
        }
    }

    return results;
}

export async function fetchToolkit(): Promise<
    Record<string, ToolkitFile[]>
> {
    const toolkitDir = path.resolve("../toolkit");

    const result: Record<string, ToolkitFile[]> = {};

    const folders = await fs.readdir(toolkitDir, {
        withFileTypes: true
    });

    for (const folder of folders) {
        if (!folder.isDirectory()) continue;

        const folderPath = path.join(toolkitDir, folder.name);
        const htmlFiles = await findHtmlFiles(folderPath);

        result[folder.name] = await Promise.all(
            htmlFiles.map(async (filePath) => {
                const htmlSnippet = await fs.readFile(filePath, "utf8");

                return {
                    fileName: path.relative(folderPath, filePath),
                    htmlSnippet,
                    htmlContent: await compileHTML(htmlSnippet)
                };
            })
        );
    }

    return result;
}