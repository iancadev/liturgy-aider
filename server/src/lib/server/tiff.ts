import sharp from 'sharp';
import crypto from 'crypto';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';


import { fileExists } from './file';

const GENERATED_DIR = path.resolve('static/generated-images');

export function isTiffSrc(src: string): boolean {
    return /\.(tif|tiff)(\?.*)?$/i.test(src);
}

export async function convertTiffToPng(src: string): Promise<string> {
    if (!(await fileExists(src))) {
        return "https://placehold.co/600x400";
    }

    if (!isTiffSrc(src)) {
        return src;
    }

    const hash = crypto
        .createHash('sha1')
        .update(src)
        .digest('hex')
        .slice(0, 12);

    const outputFilename = `${path.basename(src, path.extname(src))}-${hash}.png`;
    const outputPath = path.join(GENERATED_DIR, outputFilename);

    await mkdir(GENERATED_DIR, { recursive: true });

    // Cache conversion so you don't regenerate on every request.
    if (!(await fileExists(outputPath)) && (await fileExists(src))) {
        await sharp(src)
            .png()
            .toFile(outputPath);
    }
    return `/generated-images/${outputFilename}`;
}

export async function serveLocal(src: string): Promise<string> {
    // Assume src is an absolute path on disk
    if (!(await fileExists(src))) {
        return "https://placehold.co/600x400";
    }

    const hash = crypto
        .createHash("sha1")
        .update(src)
        .digest("hex")
        .slice(0, 12);

    const outputFilename =
        `${path.basename(src, path.extname(src))}-${hash}${path.extname(src)}`;

    const outputPath = path.join(GENERATED_DIR, outputFilename);

    await mkdir(GENERATED_DIR, { recursive: true });

    if (!(await fileExists(outputPath))) {
        await copyFile(src, outputPath);
    }

    return `/generated-images/${outputFilename}`;
}