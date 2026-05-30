import sharp from 'sharp';
import crypto from 'crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { fileExists, srcToLocalPath } from './file';

const GENERATED_DIR = path.resolve('static/generated-images');

export function isTiffSrc(src: string): boolean {
    return /\.(tif|tiff)(\?.*)?$/i.test(src);
}

export async function convertTiffToPng(src: string, HTML_FILE?: string): Promise<string> {
    const inputPath = srcToLocalPath(src, HTML_FILE);

    const hash = crypto
        .createHash('sha1')
        .update(inputPath)
        .digest('hex')
        .slice(0, 12);

    const outputFilename = `${path.basename(src, path.extname(src))}-${hash}.png`;
    const outputPath = path.join(GENERATED_DIR, outputFilename);

    await mkdir(GENERATED_DIR, { recursive: true });

    // Cache conversion so you don't regenerate on every request.
    if (!(await fileExists(outputPath))) {
        await sharp(inputPath)
            .png()
            .toFile(outputPath);
    }

    // Public URL from SvelteKit's `static/` directory
    return `/generated-images/${outputFilename}`;
}