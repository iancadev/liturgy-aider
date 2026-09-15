export async function POST({ request, cookies }) {
    let { html_file } = await request.json();

    html_file = html_file.replace(/^"+|"+$/g, '');

    cookies.set('html_file', html_file, { path: '/'});

    return new Response("All good", { status: 201 });
}