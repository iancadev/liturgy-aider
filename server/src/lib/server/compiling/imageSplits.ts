import { splitImage } from "$lib/server/splitImage";
import * as cheerio from "cheerio";

function pruneAfter(
    node: cheerio.Cheerio<any>,
    root: cheerio.Cheerio<any>
) {
    let cur = node;

    while (cur.length && cur[0] !== root[0]) {
        const parent = cur.parent();

        cur.nextAll().remove();

        cur = parent;
    }
}

function pruneBefore(
    node: cheerio.Cheerio<any>,
    root: cheerio.Cheerio<any>
) {
    let cur = node;

    while (cur.length && cur[0] !== root[0]) {
        const parent = cur.parent();

        cur.prevAll().remove();

        cur = parent;
    }
}

export async function splitImages(
    $: cheerio.CheerioAPI
) {
    const images = $("img[split]").toArray();

    for (const img of images) {
        const $img = $(img);

        const splitPoint = Number($img.attr("split"));
        const src = $img.attr("src");

        if (!src || !Number.isFinite(splitPoint)) {
            continue;
        }

        const root = $img.parents("div[is]").first();

        if (!root.length) {
            continue;
        }

        const split = await splitImage(src, splitPoint);

        if (!split) {
            continue;
        }

        const topRoot = root.clone(true, true);
        const bottomRoot = root.clone(true, true);
        const imagePath: number[] = [];

        let cur: cheerio.Element | undefined = img;

        while (cur && cur !== root[0]) {
            const parent = cur.parent;

            if (!parent) {
                break;
            }

            imagePath.unshift(
                parent.children.indexOf(cur)
            );

            cur = parent;
        }

        const getNodeByPath = (
            rootEl: cheerio.Cheerio<any>
        ) => {
            let node = rootEl[0];

            for (const idx of imagePath) {
                node = node.children[idx] as cheerio.Element;
            }

            return $(node);
        };

        const topImg = getNodeByPath(topRoot);
        const bottomImg = getNodeByPath(bottomRoot);

        topImg.attr("src", split.top);
        topImg.removeAttr("split");
        topImg.attr("split-top", "");

        bottomImg.attr("src", split.bottom);
        bottomImg.removeAttr("split");

        pruneAfter(topImg, topRoot);
        pruneBefore(bottomImg, bottomRoot);

        root.replaceWith(
            `${$.html(topRoot)}<hr imageBreak>${$.html(bottomRoot)}`
        );
    }
}