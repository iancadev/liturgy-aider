import path from 'node:path';

export function load({ cookies }) {
    if (!cookies.get('html_file')) {
        cookies.set('html_file', path.resolve('../current.html'), { path: '/' })
    }

    return { 'html_file': cookies.get('html_file') }
}