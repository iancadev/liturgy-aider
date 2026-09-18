import fs from "fs/promises";
import * as cheerio from "cheerio";

function format(html: string): string {
    return html.replace('<html><head></head><body>', '').replace('</body></html>', '')
}

import path from "path";

export async function editHtmlText(
    filePath: string,
    selector: string,
    newText: string,
    index = 0
) {
    const html = await fs.readFile(filePath, "utf-8");
    const $ = cheerio.load(html);

    const elements = $(selector);

    if (elements.length === 0) {
        console.log(`No elements found for selector: ${selector}`);
        return;
    }

    if (index < 0 || index >= elements.length) {
        console.log(`Index ${index} out of bounds. Found ${elements.length} elements.`);
        return;
    }

    const el = elements.eq(index);

    const cleanedText = newText.trim().replace(/^["']+|["']+$/g, "");

    if ($(el).get(0).tagName === "img") {
        // URLs, protocol-relative URLs, data URIs, fragments, etc.
        const normalizedSrc = cleanedText.replaceAll("\\", "/");

        const isWindowsPath = /^[a-zA-Z]:[\\/]/.test(cleanedText);

        const isNonFilesystemSrc =
            !isWindowsPath &&
            /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(normalizedSrc);

        let src = normalizedSrc;

        if (!isNonFilesystemSrc) {
            // Explicitly use Windows path handling for Windows-style paths.
            const isWindowsPath =
                /^[a-zA-Z]:[\\/]/.test(cleanedText) ||
                /^[a-zA-Z]:[\\/]/.test(filePath);

            const pathApi = isWindowsPath ? path.win32 : path;

            const htmlDir = pathApi.dirname(filePath);
            const absoluteSrc = pathApi.resolve(cleanedText);
            console.log(htmlDir);
            console.log(absoluteSrc);
            const relativeSrc = pathApi.relative(htmlDir, absoluteSrc);

            const isInsideHtmlDir =
                relativeSrc !== ".." &&
                !relativeSrc.startsWith(`..${pathApi.sep}`) &&
                !pathApi.isAbsolute(relativeSrc);

            if (isInsideHtmlDir) {
                src = relativeSrc.replaceAll(pathApi.sep, "/");
            }
        }

        $(el).attr("src", src);
    } else {
        el.contents().filter((_, node) => node.type === "text").remove();
        el.append(newText);
    }

    await fs.writeFile(filePath, format($.html()), "utf-8");
}


export async function movePageBreak(
    filePath: string,
    index: number,
    direction: "up" | "down"
) {
    const html = await fs.readFile(filePath, "utf8");
    const $ = cheerio.load(html, {
        decodeEntities: false,
        xmlMode: false,
    });

    const body = $("body");

    if (body.children().length == 0) {
        return;
    }

    let hrs = body.children("hr");

    if (index >= hrs.length) {
        body.append("<hr>");
        hrs = body.children("hr");
        index = hrs.length - 1;
    }

    const hr = hrs.eq(index);

    if (!hr.length) {
        return;
    }

    if (direction === "up") {
        const prev = hr.prevAll().filter((_, el) => el.type === "tag").first();

        if (prev.length) {
            prev.before(hr);
        }
    } else {
        const next = hr.nextAll().filter((_, el) => el.type === "tag").first();

        if (next.length) {
            next.after(hr);
        }
    }

    const elements = body.children();
    const movedHr = body.children("hr").eq(index);

    if (movedHr.length) {
        const pos = elements.index(movedHr);

        if (pos === 0 || pos === elements.length - 1) {
            movedHr.remove();
        }
    }

    await fs.writeFile(filePath, format($.html()));
}