// dummy-server.js
// A simple WebSocket server that echoes every message back to the sender.

const { WebSocketServer } = require("ws");

const PORT = 9000;
const wss = new WebSocketServer({ port: PORT });

let connectionCount = 0;

wss.on("connection", (socket) => {
  connectionCount++;
  const id = connectionCount;
  console.log(`[+] Client ${id} connected | Total: ${wss.clients.size}`);

  // Echo every message straight back
  socket.on("message", (data) => {
    socket.send(data);
  });

  socket.on("close", () => {
    console.log(`[-] Client ${id} disconnected | Total: ${wss.clients.size}`);
  });

  socket.on("error", (err) => {
    console.error(`[!] Client ${id} error:`, err.message);
  });
});

wss.on("listening", () => {
  console.log(`\n🟢 Dummy WS server running on ws://localhost:${PORT}`);
  console.log(`   Every message sent to it will be echoed back.\n`);
});