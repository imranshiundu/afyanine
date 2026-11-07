/**
 * Persistent gateway, NOT a Vercel function.
 * Start: npx tsx mini-services/realtime.ts
 * Uses the same DATABASE_URL, PG session URL, CA and clinical-consent flags.
 */
import { createServer } from "node:http";
import { Server } from "socket.io";
import { verifyTicket, socketActor } from "../src/lib/socket-auth";
import { careLive } from "../src/lib/care-live";
import { opsLive, opsCommand } from "../src/lib/ops-live";
import { careCommand } from "../src/lib/care-workspace";
import { CareError } from "../src/lib/care-policy";
import { subscribeLive } from "../src/lib/live-db";

const origins = new Set((process.env.REALTIME_ALLOWED_ORIGINS ?? "").split(",").map(s => s.trim().replace(/\/$/, "")).filter(Boolean));
if (!origins.size) throw new Error("Set REALTIME_ALLOWED_ORIGINS to the exact application origins.");
const server = createServer((_req, res) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ service: "afyanine-realtime" })); });
const io = new Server(server, {
  maxHttpBufferSize: 24000, transports: ["websocket"], pingInterval: 10000, pingTimeout: 10000,
  allowRequest: (req, done) => done(null, origins.has(req.headers.origin ?? "")),
});
io.use(async (socket, next) => {
  try {
    socket.data.claims = verifyTicket(socket.handshake.auth?.ticket);
    await socketActor(socket.data.claims);
    next();
  } catch { next(new Error("Sign in again or check access.")); }
});
io.on("connection", async socket => {
  let busy = false, pending = false;
  let listening = false;
  const refresh = async () => {
    if (busy) { pending = true; return; }
    busy = true;
    do {
      pending = false;
      try {
        const actor = await socketActor(socket.data.claims);
        const snapshot = socket.data.claims.ops ? await opsLive(actor) : await careLive(actor);
        if (socket.connected) socket.emit("snapshot", { ...snapshot, streaming: listening, deliveredAt: Date.now() });
      } catch (error) {
        if (error instanceof CareError && [401, 403].includes(error.status)) {
          // Erase cached PHI before disconnecting a revoked/expired session.
          socket.emit("access:revoked"); socket.disconnect(true);
        } else socket.emit("live:offline"); // transient DB faults are not logout
      }
    } while (pending && socket.connected);
    busy = false;
  };
  let unsubscribe = () => {};
  let retry: ReturnType<typeof setTimeout> | undefined;
  const attach = async () => {
    unsubscribe(); listening = false;
    if (!socket.connected) return;
    try {
      const release = await subscribeLive(error => {
        if (error) {
          listening = false; socket.emit("live:offline");
          clearTimeout(retry); retry = setTimeout(() => void attach(), 1500);
        } else void refresh();
      });
      if (!socket.connected) { release(); return; }
      unsubscribe = release; listening = true; void refresh();
    } catch {
      socket.emit("live:offline");
      clearTimeout(retry); retry = setTimeout(() => void attach(), 3000);
    }
  };
  void attach();
  const timer = setInterval(() => { void refresh(); }, 15000); // heals missed notifications/reconnect
  socket.on("refresh", () => { void refresh(); });
  let commandBusy = false;
  socket.on("command", async (body, ack) => {
    if (typeof ack !== "function") return;
    if (commandBusy) return ack({ error: "Please wait for the current request." });
    commandBusy = true;
    try {
      const actor = await socketActor(socket.data.claims);
      const result = socket.data.claims.ops ? await opsCommand(actor, body) : await careCommand(actor, body);
      ack(result); void refresh();
    } catch (error) { ack({ error: error instanceof CareError ? error.code : "Could not save. Refresh to check the current state." }); }
    finally { commandBusy = false; }
  });
  socket.on("disconnect", () => { unsubscribe(); clearInterval(timer); clearTimeout(retry); });
  void refresh();
});
server.listen(Number(process.env.REALTIME_PORT ?? 3003), "0.0.0.0", () => console.log("AfyaNine authenticated Socket.IO gateway ready"));
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => { io.close(); server.close(); });
