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

async function getRegions(image): Promise<{ start: number, end: number }[]> {
    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;

    const whiteRows: boolean[] = [];

    for (let y = 0; y < height; y++) {
        let isWhite = width;

        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;

            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // tolerate tiny compression / conversion errors
            if (r < 235 || g < 235 || b < 235) {
                isWhite -= 1;
                // break;
            }
        }

        let fraction = isWhite / width;

        whiteRows.push(fraction > 0.99);
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

    return regions;
}


export async function estimateFont(src: string, percentile: number=0.3): Promise<number> {
    const exists = await fileExists(src);
    if (!(await fileExists(src)) ||
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("data:")) {
        return null;
    }

    const image = sharp(src);

    let regions = await getRegions(image);

    let deltas = [];
    for (let i = 0; i < regions.length - 1; i++) {
        deltas.push(regions[i+1].start - regions[i].end);
    }
    deltas.sort((a, b) => a - b);

    // estimate based on clef-height (about 4.3x the size of the font)
    return Math.max(...deltas) / 4.3;

    // console.log(src);
    // console.log(deltas);
    // console.log(deltas[Math.floor(deltas.length * percentile)]);

    // const max = Math.max(...deltas);
    // let filtered = deltas.filter((v) => {
    //     if ((0.2*max < v) && (v < 0.5*max)) return true;
    //     return;
    // })
    // console.log(filtered);

    // let average = 0;
    // for (const v of filtered) average += v / filtered.length;

    // console.log(average);
    // if (average) return average;
    // return deltas[Math.floor(deltas.length * percentile)];
}


export async function splitImage(
    src: string,
    splitPoint: number
): Promise<SplitResult | null> {
    const exists = await fileExists(src);
    if (!(await fileExists(src)) ||
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("data:")) {
        return null;
    }

    const image = sharp(src);

    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;

    let regions = await getRegions(image);

    if (splitPoint < 0 || splitPoint >= regions.length) {
        return null;
    }

    const region = regions[splitPoint];

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
        top: topPath,
        bottom: bottomPath
    };
}