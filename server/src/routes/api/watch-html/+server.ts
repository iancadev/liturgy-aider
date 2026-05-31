import { htmlFileEvent, watchHtmlFile } from "$lib/server/fileWatcher";

export function GET({ cookies }) {
    if (!cookies.get('html_file')) return new Response("No html_file to watch in cookies", {
        status: 500,
        headers: { "Content-Type": "text/plain" }
    });

    watchHtmlFile(cookies.get('html_file'))

    let listener: (() => void) | undefined;

    const stream = new ReadableStream({
        start(controller) {
            const listener = () => {
                try {
                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: changed\n\n`
                        )
                    );
                } catch { }
            };

            htmlFileEvent.on("changed", listener);
        },
        cancel() {
            if (listener) {
                htmlFileEvent.off("changed", listener);
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache"
        }
    });
}