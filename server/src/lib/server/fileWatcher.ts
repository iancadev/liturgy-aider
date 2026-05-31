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

// export function unwatchStyles() {
//     stylesWatcher?.close();
//     stylesWatcher = undefined;
// }



export const htmlFileEvent = new EventEmitter();

const watchers = new Map<string, fs.FSWatcher>();

export function watchHtmlFile(file: string) {
    if (watchers.has(file)) return;

    const watcher = fs.watch(file, () => {
        htmlFileEvent.emit("changed", file);
    });

    watchers.set(file, watcher);
}

export function unwatchHtmlFile(file: string) {
    const watcher = watchers.get(file);

    if (!watcher) return;

    watcher.close();
    watchers.delete(file);
}