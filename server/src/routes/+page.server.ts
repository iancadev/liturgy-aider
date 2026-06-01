import path from 'node:path';
import { fileExists } from '$lib/server/file';

export async function load({ cookies, depends }) {
    depends('app:html_file');

    if (!cookies.get('html_file')) {
        cookies.set('html_file', path.resolve('../current.html'), { path: '/' })
    }
    
    const html_file = cookies.get('html_file');

    const doesExist = await fileExists(html_file);
    const warning = doesExist ? undefined : "Warning: current file does not exist";

    return { html_file, warning }
}