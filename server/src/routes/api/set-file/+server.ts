export async function POST({ request, cookies }) {
    const { html_file } = await request.json();

    cookies.set('html_file', html_file, { path: '/'});

    return new Response("All good", { status: 201 });
}