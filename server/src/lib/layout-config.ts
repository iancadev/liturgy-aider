// layout-config.ts
import { writable } from "svelte/store";


const Inches = 96; // pixels


export const config = writable({
    IDEAL_FONT: 12,
    MIN_FONT: 9,
    MAX_FONT: 14,

    IDEAL_PADDING: 1 * Inches,
    MIN_PADDING: 0.1 * Inches,
    MAX_PADDING: 2 * Inches,

    IDEAL_GAP: 1 * Inches,
    MIN_GAP: 0.1 * Inches,
    MAX_GAP: 2 * Inches,

    PADDING_X: 0.5 * Inches
});
