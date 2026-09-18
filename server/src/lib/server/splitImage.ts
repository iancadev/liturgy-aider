import sharp from "sharp";
import crypto from "crypto";
import path from "node:path";
import { mkdir } from "node:fs/promises";

import { fileExists } from "./file";

const GENERATED_DIR = path.resolve("static/generated-images");

export interface Region {
    start: number;
    end: number;
}

export interface SplitResult {
    top: string;
    bottom: string;
}

type RegionColor = "white" | "black";


// -----------------------------------------------------------------------------
// Region detection
// -----------------------------------------------------------------------------

async function getRegions(
    image: sharp.Sharp,
    color: RegionColor,
    tolerance?: number
): Promise<Region[]> {
    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;

    const matchingRows: boolean[] = [];

    tolerance = tolerance ?? 1;

    for (let y = 0; y < height; y++) {
        let matching = 0;
        let total = 0;

        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;

            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            total++;

            const isMatching =
                color === "white"
                    ? r > 235 && g > 235 && b > 235
                    : r < 180 && g < 180 && b < 180;

            if (isMatching) {
                matching++;
            }
        }

        matchingRows.push(matching >= tolerance * total);
    }

    // Group consecutive matching rows.
    const regions: Region[] = [];

    let start: number | null = null;

    for (let y = 0; y < height; y++) {
        if (matchingRows[y]) {
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


// -----------------------------------------------------------------------------
// Group detection
// -----------------------------------------------------------------------------

interface DetectedGroup extends Region {
    regions: Region[];
}

function getGroups(regions: Region[]): DetectedGroup[] {
    if (regions.length < 2) {
        return [];
    }

    // Distance from one region to the next.
    const distancesToNext: number[] = [];

    for (let i = 0; i < regions.length - 1; i++) {
        distancesToNext.push(
            regions[i + 1].start - regions[i].end - 1
        );
    }

    if (distancesToNext.length === 0) {
        return [];
    }

    // Find the largest gap in the sorted distances.
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

    const meanDistance =
        distancesToNext.reduce((a, b) => a + b, 0) /
        distancesToNext.length;

    const shouldSplit =
        bestThreshold !== null &&
        bestGap > Math.max(2, meanDistance * 0.75);

    const groups: DetectedGroup[] = [];

    let currentRegions: Region[] = [regions[0]];

    for (let i = 0; i < distancesToNext.length; i++) {
        const gap = distancesToNext[i];

        if (
            shouldSplit &&
            bestThreshold !== null &&
            gap > bestThreshold
        ) {
            groups.push({
                start: currentRegions[0].start,
                end: currentRegions[currentRegions.length - 1].end,
                regions: currentRegions
            });

            currentRegions = [regions[i + 1]];
        } else {
            currentRegions.push(regions[i + 1]);
        }
    }

    if (currentRegions.length > 0) {
        groups.push({
            start: currentRegions[0].start,
            end: currentRegions[currentRegions.length - 1].end,
            regions: currentRegions
        });
    }

    return groups;
}


// -----------------------------------------------------------------------------
// Font estimation
// -----------------------------------------------------------------------------

export async function estimateFont(
    src: string,
): Promise<number | null> {
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

    // Font strokes are detected as full-black regions.
    const regions = await getRegions(image, "black", 0.9);

    const groups = getGroups(regions);

    if (groups.length === 0) {
        return null;
    }

    // Width of each group.
    //
    // These groups represent the black strokes plus the whitespace
    // between strokes that belongs to that group.
    const groupWidths = groups.map(
        group => group.end - group.start + 1
    );

    const avgGroup =
        groupWidths.reduce((a, b) => a + b, 0) /
        groupWidths.length;

    return avgGroup / 2.56;
}


// -----------------------------------------------------------------------------
// Image splitting
// -----------------------------------------------------------------------------

export async function splitImage(
    src: string,
    splitPoint: number
): Promise<SplitResult | null> {
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

    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height } = info;

    // Image splitting is based on full-white regions.
    const regions = await getRegions(image, "white");

    if (splitPoint < 0 || splitPoint >= regions.length) {
        return null;
    }

    const region = regions[splitPoint];

    const cutY = Math.floor(
        (region.start + region.end) / 2
    );

    const hash = crypto
        .createHash("sha1")
        .update(`${src}:${splitPoint}`)
        .digest("hex")
        .slice(0, 12);

    await mkdir(GENERATED_DIR, { recursive: true });

    const topFile =
        `${path.basename(src, path.extname(src))}-${hash}-top.png`;

    const bottomFile =
        `${path.basename(src, path.extname(src))}-${hash}-bottom.png`;

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


// -----------------------------------------------------------------------------
// Visualization helper
// -----------------------------------------------------------------------------

async function createRegionOverlay(
    src: string,
    regions: Region[],
    suffix: string
): Promise<string | null> {
    const image = sharp(src);

    const { width, height } = await image.metadata();

    if (!width || !height) {
        return null;
    }

    await mkdir(GENERATED_DIR, { recursive: true });

    const hash = crypto
        .createHash("sha1")
        .update(`${src}:${suffix}`)
        .digest("hex")
        .slice(0, 12);

    const outputFile =
        `${path.basename(src, path.extname(src))}-${hash}-${suffix}.png`;

    const outputPath = path.join(GENERATED_DIR, outputFile);

    const overlay = Buffer.from(`
        <svg
            width="${width}"
            height="${height}"
            xmlns="http://www.w3.org/2000/svg"
        >
            ${regions.map(region => `
                <rect
                    x="0"
                    y="${region.start}"
                    width="${width}"
                    height="${region.end - region.start + 1}"
                    fill="red"
                    fill-opacity="0.35"
                />
                <line
                    x1="0"
                    y1="${region.start}"
                    x2="${width}"
                    y2="${region.start}"
                    stroke="red"
                    stroke-width="2"
                />
                <line
                    x1="0"
                    y1="${region.end + 1}"
                    x2="${width}"
                    y2="${region.end + 1}"
                    stroke="red"
                    stroke-width="2"
                />
            `).join("")}
        </svg>
    `);

    await image
        .composite([
            {
                input: overlay,
                top: 0,
                left: 0
            }
        ])
        .png()
        .toFile(outputPath);

    return `/generated-images/${outputFile}`;
}


// -----------------------------------------------------------------------------
// White-region visualization
// -----------------------------------------------------------------------------

export async function showWhiteRegions(
    src: string
): Promise<string | null> {
    const exists = await fileExists(src);

    if (
        !exists ||
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("data:")
    ) {
        return null;
    }

    const regions = await getRegions(sharp(src), "white");

    return createRegionOverlay(
        src,
        regions,
        "white-regions"
    );
}


// -----------------------------------------------------------------------------
// Black-region visualization
// -----------------------------------------------------------------------------

export async function showDetectedLines(
    src: string
): Promise<string | null> {
    const exists = await fileExists(src);

    if (
        !exists ||
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("data:")
    ) {
        return null;
    }

    const regions = await getRegions(sharp(src), "black", 0.9);

    return createRegionOverlay(
        src,
        regions,
        "detected-lines"
    );
}


// -----------------------------------------------------------------------------
// Group visualization
// -----------------------------------------------------------------------------

export async function showDetectedGroups(
    src: string
): Promise<string | null> {
    const exists = await fileExists(src);

    if (
        !exists ||
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("data:")
    ) {
        return null;
    }

    const regions = await getRegions(sharp(src), "black", 0.9);
    const groups = getGroups(regions);

    // The groups themselves are Regions, so they can use the same
    // visualization helper.
    return createRegionOverlay(
        src,
        groups,
        "detected-groups"
    );
}