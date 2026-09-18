import { fileURLToPath } from 'node:url';
import { showWhiteRegions, showDetectedLines, showDetectedGroups } from '$lib/server/splitImage';

export async function load() {
    const image = fileURLToPath(
        new URL('./introit.png', import.meta.url)
    );

    const whiteRegions = await showWhiteRegions(image);
    const detectedLines = await showDetectedLines(image);
    const detectedGroups = await showDetectedGroups(image);

    return { whiteRegions, detectedLines, detectedGroups };
}