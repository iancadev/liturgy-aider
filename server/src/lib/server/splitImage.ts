// splitImage.ts

import sharp from "sharp";
import crypto from "crypto";
import path from "node:path";
import { mkdir } from "node:fs/promises";

import { fileExists } from "./file";

const GENERATED_DIR = path.resolve("static/generated-images");

export interface SplitResult {
    top: string;
    bottom: string;
}

export async function splitImage(
    src: string,
    splitPoint: number
): Promise<SplitResult | null> {
    if (!(await fileExists(src))) {
        return null;
    }

    const image = sharp(src);

    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;

    const whiteRows: boolean[] = [];

    for (let y = 0; y < height; y++) {
        let isWhite = true;

        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;

            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // tolerate tiny compression / conversion errors
            if (r < 250 || g < 250 || b < 250) {
                isWhite = false;
                break;
            }
        }

        whiteRows.push(isWhite);
    }

    // Group consecutive white rows into regions.
    const regions: Array<{ start: number; end: number }> = [];

    let start: number | null = null;

    for (let y = 0; y < height; y++) {
        if (whiteRows[y]) {
            if (start === null) {
                start = y;
            }
        } else if (start !== null) {
            regions.push({
                start,
                end: y - 1
            });
            start = null;
        }
    }

    if (start !== null) {
        regions.push({
            start,
            end: height - 1
        });
    }

    if (splitPoint < 1 || splitPoint > regions.length) {
        return null;
    }

    const region = regions[splitPoint - 1];

    const cutY = Math.floor((region.start + region.end) / 2);

    const hash = crypto
        .createHash("sha1")
        .update(`${src}:${splitPoint}`)
        .digest("hex")
        .slice(0, 12);

    await mkdir(GENERATED_DIR, { recursive: true });

    const topFile = `${path.basename(src, path.extname(src))}-${hash}-top.png`;
    const bottomFile = `${path.basename(src, path.extname(src))}-${hash}-bottom.png`;

    const topPath = path.join(GENERATED_DIR, topFile);
    const bottomPath = path.join(GENERATED_DIR, bottomFile);

    if (!(await fileExists(topPath))) {
        await sharp(src)
            .extract({
                left: 0,
                top: 0,
                width,
                height: cutY
            })
            .png()
            .toFile(topPath);
    }

    if (!(await fileExists(bottomPath))) {
        await sharp(src)
            .extract({
                left: 0,
                top: cutY,
                width,
                height: height - cutY
            })
            .png()
            .toFile(bottomPath);
    }

    return {
        top: `/generated-images/${topFile}`,
        bottom: `/generated-images/${bottomFile}`
    };
}