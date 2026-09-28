import { stylesEvent, watchStyles } from "$lib/server/fileWatcher";

export async function GET({ cookies }) {
    if (!cookies.get('html_file')) return new Response("No html_file to watch in cookies", {
        status: 500,
        headers: { "Content-Type": "text/plain" }
    });

    await watchStyles(cookies.get('html_file'))

    let listener: (() => void) | undefined;

    const stream = new ReadableStream({
        start(controller) {
            listener = () => {
                try {
                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: changed\n\n`
                        )
                    );
                } catch { }
            };

            stylesEvent.on("changed", listener);
        },
        cancel() {
            if (listener) {
                stylesEvent.off("changed", listener);
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