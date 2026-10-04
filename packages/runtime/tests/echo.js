// A WebSocket server for the tests: it sends back what it is sent, and
// closes when it is sent "bye". Of the subprotocols asked for it takes "b".
import { createHash } from "node:crypto";
import { createServer } from "node:http";

const MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const TEXT = 1;
const CLOSE = 8;
const PING = 9;
const PONG = 10;

function serve(request, socket) {
  const accept = createHash("sha1")
    .update(request.headers["sec-websocket-key"] + MAGIC)
    .digest("base64");
  const asked = (request.headers["sec-websocket-protocol"] ?? "").split(",").map((name) => name.trim());
  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      ...(asked.includes("b") ? ["Sec-WebSocket-Protocol: b"] : []),
      "",
      "",
    ].join("\r\n"),
  );
  // The frames here are short: their length is in their second byte.
  const send = (opcode, payload) => socket.write(Buffer.concat([Buffer.from([0x80 | opcode, payload.length]), payload]));
  let rest = Buffer.alloc(0);
  let closing = false;
  socket.on("data", (chunk) => {
    rest = Buffer.concat([rest, chunk]);
    while (rest.length >= 6) {
      const opcode = rest[0] & 15;
      const length = rest[1] & 127;
      if (rest.length < 6 + length) return;
      const mask = rest.subarray(2, 6);
      const payload = Buffer.from(rest.subarray(6, 6 + length));
      for (let index = 0; index < length; index++) payload[index] ^= mask[index % 4];
      rest = rest.subarray(6 + length);
      if (opcode === CLOSE) {
        // Agreed to, unless it is the answer to its own.
        if (!closing) send(CLOSE, payload);
        socket.end();
        return;
      }
      if (opcode === PING) send(PONG, payload);
      else if (opcode === TEXT && String(payload) === "bye") {
        closing = true;
        send(CLOSE, Buffer.from([3, 232]));
      }
      else send(opcode, opcode === TEXT ? Buffer.from(`echo:${payload}`) : payload);
    }
  });
  socket.on("error", () => {});
}

// Listens on `port`, or on one that is free: `{ url, close }`.
export function echo(port = 0) {
  const server = createServer();
  const sockets = new Set();
  server.on("upgrade", (request, socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    serve(request, socket);
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () =>
      resolve({
        url: `ws://127.0.0.1:${server.address().port}`,
        close: () =>
          new Promise((closed) => {
            for (const socket of sockets) socket.destroy();
            server.close(closed);
          }),
      }),
    );
  });
}
