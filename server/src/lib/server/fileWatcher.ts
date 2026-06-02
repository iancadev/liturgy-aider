import fs from "fs";
import path from "path";
import { EventEmitter } from "events";

export const stylesEvent = new EventEmitter();

export const stylesDir = path.resolve('../styles');

let stylesWatcher: fs.FSWatcher | undefined;

export function watchStyles() {
    stylesWatcher?.close();

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

watchStyles();



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

export function watchHtmlFile(file: string) {
    watcher?.close()

    watcher = fs.watch(file, () => {
        htmlFileEvent.emit("changed", file);
    });
}