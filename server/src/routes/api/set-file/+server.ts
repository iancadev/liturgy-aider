export async function POST({ request, cookies }) {
    const { html_file } = await request.json();

    cookies.set('html_file', html_file, { path: '/'});

    console.log(cookies.get('html_file'));

    return new Response("All good", { status: 201 });
}