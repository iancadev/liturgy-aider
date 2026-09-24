import fs from 'node:fs/promises';
import { dirname, fileExists } from '$lib/server/file';
import * as path from "path";
import * as cheerio from "cheerio";
import { resolveAbsolutePath } from '$lib/server/htmlProcessing';

export async function GET({ cookies }) {
    if (!cookies.get('html_file')) return new Response("No html_file to watch in cookies", {
        status: 500,
        headers: { "Content-Type": "text/plain" }
    });

    async function fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    const html_file = cookies.get('html_file');
    const html_dir = dirname(html_file);
    let html = await fs.readFile(html_file, 'utf-8');
    const $ = cheerio.load(html, {
        decodeEntities: false
    });

    // the resources directory is in the same folder as the html_file
    const resources_dir = path.join(html_dir, 'resources');

    // check if resources_dir exists
    if (!await fileExists(resources_dir)) {
        return new Response("Resources directory not found", {
            status: 500,
            headers: { "Content-Type": "text/plain" }
        });
    }

    // get list of all image files' absolute paths directly in resources_dir
    // exclude directories
    const descendants = await fs.readdir(resources_dir);
    const full_paths = descendants.map((file) => path.join(resources_dir, file));
    const file_paths = await Promise.all(
        full_paths.filter(async (file) => (await fs.stat(file)).isDirectory())
    )

    // get all image src attributes from the HTML, resolving as absolute paths
    const img_srcs = await Promise.all($("img").map(async (i, el) => await resolveAbsolutePath(html_dir, $(el).attr("src"))).get());

    // find unused image paths
    const unused_image_paths = file_paths.filter((path) => !img_srcs.includes(path));

    // move unused image paths to an "unused" subdirectory
    const unused_dir = path.join(resources_dir, 'unused');
    if (!await fileExists(unused_dir)) {
        await fs.mkdir(unused_dir);
    }
    for (const filePath of unused_image_paths) {
        await fs.rename(filePath, path.join(unused_dir, path.basename(filePath)));
    }

    return new Response("Unused images moved to 'unused' directory", {
        status: 200,
        headers: { "Content-Type": "text/plain" }
    });
}