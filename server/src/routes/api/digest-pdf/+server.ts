import { json } from "@sveltejs/kit";
import { dirname } from '$lib/server/file';
import { access, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import crypto from "node:crypto";

const execFileAsync = promisify(execFile);

async function getUniqueDirectory(baseDir: string, name: string): Promise<string> {
    let i = 0;

    while (true) {
        const folderName = i === 0
            ? name
            : `${name}-${i}`;

        const dir = path.join(baseDir, folderName);

        try {
            await access(dir);
            i++;
        } catch {
            await mkdir(dir);
            return dir;
        }
    }
}

export async function POST({ request }) {
    if (!cookies.get('html_file')) return new Response("No html_file to watch in cookies", {
        status: 500,
        headers: { "Content-Type": "text/plain" }
    });

    const html_file = cookies.get('html_file');
    const html_dir = dirname(html_file);

    const OUTPUT_BASE_DIR = path.join(html_dir, "resources");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return json({ error: "No PDF file provided." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
        return json({ error: "File must be a PDF." }, { status: 400 });
    }

    // Remove the .pdf extension
    const folderName = path.basename(
        file.name,
        path.extname(file.name)
    );

    const outputDir = await getUniqueDirectory(
        OUTPUT_BASE_DIR,
        folderName
    );

    await mkdir(outputDir, { recursive: true });

    // Unique temporary filename
    const tempPdf = path.join(
        outputDir,
        `.input-${crypto.randomUUID()}.pdf`
    );

    await writeFile(
        tempPdf,
        Buffer.from(await file.arrayBuffer())
    );

    try {
        const outputPrefix = path.join(outputDir, "image");

        await execFileAsync("pdfimages", [
            "-png",
            tempPdf,
            outputPrefix
        ]);

        return json({
            success: true,
            directory: outputDir
        });
    } catch (error) {
        console.error(error);

        return json(
            { error: "Failed to extract images from PDF." },
            { status: 500 }
        );
    } finally {
        await rm(tempPdf, { force: true });
    }
}