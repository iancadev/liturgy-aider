import { toolkitEvent } from "$lib/server/fileWatcher";

export function GET() {
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

            toolkitEvent.on("changed", listener);
        },
        cancel() {
            if (listener) {
                toolkitEvent.off("changed", listener);
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