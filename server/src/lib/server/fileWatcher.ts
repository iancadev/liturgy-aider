import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import { dirExists, fileExists } from "./file";

export const stylesEvent = new EventEmitter();

export const stylesDir = path.resolve('../styles');

let stylesWatcher: fs.FSWatcher | undefined;

export async function watchStyles(file: string) {
    stylesWatcher?.close();

    if (!await fileExists(file)) return;

    const stylesDir = path.join(path.dirname(file), 'styles');

    if (!await dirExists(stylesDir)) return;

    stylesWatcher = fs.watch(stylesDir, { recursive: true }, (event, filename) => {
        if (!filename) return;

        if (path.extname(filename) === ".css") {
            stylesEvent.emit("changed", {
                event,
                filename
            });
        }
    });
}



export const toolkitEvent = new EventEmitter();

export const toolkitDir = path.resolve('../toolkit');

let toolkitWatcher: fs.FSWatcher | undefined;

export function watchToolkit() {
    toolkitWatcher?.close();

    toolkitWatcher = fs.watch(toolkitDir, { recursive: true }, (event, filename) => {
        if (!filename) return;

        if (path.extname(filename) === ".html") {
            toolkitEvent.emit("changed", {
                event,
                filename
            });
        }
    });
}

watchToolkit();



export const htmlFileEvent = new EventEmitter();

let watcher: fs.FSWatcher | undefined;

export async function watchHtmlFile(file: string) {
    watcher?.close();

    if (!await fileExists(file)) return;

    let timeout: NodeJS.Timeout | undefined;

    watcher = fs.watch(file, () => {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            htmlFileEvent.emit("changed", file);
        }, 100);
    });
}