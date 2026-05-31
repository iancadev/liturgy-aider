import { editHtmlText } from "$lib/server/htmlEditing";

export async function POST({ request, cookies }) {
    if (!cookies.get('html_file')) return new Response("No html_file to edit in cookies", {
        status: 500,
        headers: { "Content-Type": "text/plain" }
    });

    const { target, value } = await request.json();

    editHtmlText(
        cookies.get('html_file'),
        target,
        value
    )
    
    return new Response("All good", { status: 201 });
}