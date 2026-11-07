import { careActor } from "@/lib/care-auth";
import { careHttpError, careWorkspace } from "@/lib/care-workspace";
import { subscribeLive } from "@/lib/live-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    await careActor(request);
    const encoder = new TextEncoder();
    let stop: (() => void) | undefined;
    const stream = new ReadableStream({
      async start(controller) {
        let closed = false, pending = false, dirty = false;
        let heartbeat: ReturnType<typeof setInterval> | undefined;
        let lifetime: ReturnType<typeof setTimeout> | undefined;
        let unsubscribe: (() => void) | undefined;
        const send = (event: string, data: unknown) => {
          if (!closed) controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };
        const cleanup = () => {
          if (closed) return;
          closed = true; unsubscribe?.(); clearInterval(heartbeat); clearTimeout(lifetime);
          request.signal.removeEventListener("abort", cleanup);
          try { controller.close(); } catch { /* client already disconnected */ }
        };
        stop = cleanup;
        const update = async (failed = false) => {
          if (closed) return;
          if (failed) { send("unavailable", {}); cleanup(); return; }
          if (pending) { dirty = true; return; }
          pending = true;
          try {
            // Reauthorize every delivery; never trust the PG notification as data.
            const actor = await careActor(request);
            const data = await careWorkspace(actor);
            send("workspace", data);
          } catch { send("unavailable", {}); cleanup(); }
          finally {
            pending = false;
            if (dirty && !closed) { dirty = false; void update(); }
          }
        };
        try {
          unsubscribe = await subscribeLive(failed => void update(failed));
          if (closed) { unsubscribe(); return; }
          request.signal.addEventListener("abort", cleanup);
          if (request.signal.aborted) { cleanup(); return; }
          send("connected", {});
          await update();
          if (closed) return;
          heartbeat = setInterval(() => { void careActor(request).then(() => send("heartbeat", {})).catch(() => { send("unavailable", {}); cleanup(); }); }, 20000);
          // Reconnect before the hosting platform's request-duration limit.
          lifetime = setTimeout(cleanup, 240000);
        } catch { send("unavailable", {}); cleanup(); }
      },
      cancel() { stop?.(); },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" } });
  } catch (error) { return careHttpError(error); }
}
