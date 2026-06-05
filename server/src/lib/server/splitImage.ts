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

async function getRegions(image, startLeft?:number): Promise<{ start: number, end: number }[]> {
    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;

    const whiteRows: boolean[] = [];

    for (let y = 0; y < height; y++) {
        let isWhite = 0;
        let total = 0;

        for (let x = startLeft ? Math.floor(width*startLeft) : 0; x < width; x++) {
            const idx = (y * width + x) * channels;

            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // tolerate tiny compression / conversion errors
            total++;
            if (r < 235 || g < 235 || b < 235) {
                isWhite++;
            }
        }

        let fraction = isWhite / total;

        whiteRows.push(fraction > 0.95);
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


export async function estimateFont(
    src: string,
): Promise<number> {
    const exists = await fileExists(src);

    if (
        !exists ||
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("data:")
    ) {
        return null;
    }

    const image = sharp(src);

    const regions = await getRegions(image, 0.98);

    if (regions.length < 2) {
        return null;
    }

    // Width of each detected stroke region
    const strokeWidths: number[] = [];
    for (const region of regions) {
        strokeWidths.push(region.end - region.start);
    }

    // Distance from one stroke to the next
    const distancesToNext: number[] = [];
    for (let i = 0; i < regions.length - 1; i++) {
        distancesToNext.push(regions[i + 1].start - regions[i].end);
    }

    if (distancesToNext.length === 0) {
        return null;
    }

    // ---------------------------------------------------------------------
    // Find the threshold that maximizes the *margin* between consecutive
    // sorted distances.
    //
    // Example:
    // [1, 2, 2, 3, 15, 16]
    // largest jump is between 3 and 15 -> threshold = 9
    // ---------------------------------------------------------------------

    const sorted = [...distancesToNext].sort((a, b) => a - b);

    let bestGap = -Infinity;
    let bestThreshold: number | null = null;

    for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i];
        const b = sorted[i + 1];

        const gap = b - a;

        if (gap > bestGap) {
            bestGap = gap;
            bestThreshold = (a + b) / 2;
        }
    }

    // ---------------------------------------------------------------------
    // Decide whether the split is actually meaningful.
    //
    // If the max gap is too small relative to the scale of the distances,
    // treat everything as one group.
    // ---------------------------------------------------------------------

    const meanDistance =
        distancesToNext.reduce((a, b) => a + b, 0) /
        distancesToNext.length;

    const shouldSplit =
        bestThreshold !== null &&
        bestGap > Math.max(2, meanDistance * 0.75);

    console.log(src);
    console.log("strokeWidths", strokeWidths);
    console.log("distancesToNext", distancesToNext);
    console.log("bestGap", bestGap);
    console.log("bestThreshold", bestThreshold);
    console.log("shouldSplit", shouldSplit);

    // ---------------------------------------------------------------------
    // Build groups
    // ---------------------------------------------------------------------

    const groups: number[] = [];

    let currentGroup = strokeWidths[0];
    let groupInclusion = [ strokeWidths[0] ];

    for (let i = 0; i < distancesToNext.length; i++) {
        const gap = distancesToNext[i];

        // Large gap => split group
        if (
            shouldSplit &&
            bestThreshold !== null &&
            gap > bestThreshold
        ) {
            groups.push(currentGroup);
            currentGroup = strokeWidths[i];
            console.log(groupInclusion);
            groupInclusion = [ strokeWidths[i] ];
        } else {
            currentGroup += gap + strokeWidths[i];
            groupInclusion.push(gap, strokeWidths[i]);
        }
    }

    if (currentGroup > 0) {
        groups.push(currentGroup);
        console.log(groupInclusion)
    }

    if (groups.length === 0) {
        return null;
    }

    // Average group width
    const avgGroup =
        groups.reduce((a, b) => a + b, 0) / groups.length;

    return avgGroup / 2.56;
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