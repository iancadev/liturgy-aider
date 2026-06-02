import { movePageBreak } from "$lib/server/htmlEditing";

export async function POST({ request, cookies }) {
    if (!cookies.get('html_file')) return new Response("No html_file to edit in cookies", {
        status: 500,
        headers: { "Content-Type": "text/plain" }
    });

    const { index, direction } = await request.json();

    movePageBreak(
        cookies.get('html_file'),
        index,
        direction
    )
    
    return new Response("All good", { status: 201 });
}