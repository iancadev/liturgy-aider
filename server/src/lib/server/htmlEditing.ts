import fs from "fs/promises";
import * as parse5 from "parse5";


function match(node: any, selectorParts: string[]): boolean {
    if (!node.tagName) return false;
    console.log(node, selectorParts);

    const tagMatch = selectorParts[0].match(/^([a-z0-9-]+)/i);
    console.log(node.tagName, tagMatch);

    if (!tagMatch) return false;

    if (node.tagName !== tagMatch[1]) return false;

    const attrMatches = selectorParts.slice(1);
    for (const part of attrMatches) {
        const m = part.match(/\[([^=]+)="([^"]+)"\]/);
        if (!m) continue;

        const [, attr, val] = m;
        if (node.attrs?.find((a: any) => a.name === attr)?.value !== val) {
            return false;
        }
    }

    return true;
}


function walk(node: any, fn: (n: any) => void) {
    fn(node);
    if (!node.childNodes) return;
    for (const child of node.childNodes) {
        walk(child, fn);
    }
}


export async function editHtmlText(
    filePath: string,
    selector: string,
    newText: string,
    index = 0
) {
    const html = await fs.readFile(filePath, "utf-8");

    const document = parse5.parse(html, {
        sourceCodeLocationInfo: true
    });

    const parts = selector.split(" ").filter(Boolean);

    const matches: any[] = [];

    walk(document, (node) => {
        if (match(node, parts)) {
            matches.push(node);
        }
    });

    if (matches.length === 0) {
        throw new Error("No matches found");
    }

    const node = matches[index];

    if (!node.childNodes?.length) {
        throw new Error("Node has no text children");
    }

    const textNode = node.childNodes.find(
        (n: any) => n.nodeName === "#text"
    );

    if (!textNode?.sourceCodeLocation) {
        throw new Error("No source location found");
    }

    const loc = textNode.sourceCodeLocation;

    const start = loc.startOffset;
    const end = loc.endOffset;

    // PATCH ORIGINAL STRING (this preserves formatting elsewhere)
    const updated =
        html.slice(0, start) +
        newText +
        html.slice(end);

    await fs.writeFile(filePath, updated, "utf-8");
}