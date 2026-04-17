const WebSocket = require('ws');

const NUM_CONNECTIONS = 5;
const TIMEOUT_MS = 2000;

function createConnection(connId)
{
  const ws = new WebSocket('wss://ws.ifelse.io');

let msgid = 0;
const pending = {};

ws.on('open', () => {
  console.log("Connected to server");
  setInterval(() => {
    msgid++;
    const message = JSON.stringify({ id : msgid, text: "Hello" });

    start = process.hrtime.bigint();
    pending[msgid] = start;

    ws.send(message);
  },1000); // send every 1 second 
});

let timeoutcount = 0;
setInterval(() => {
  const now = process.hrtime.bigint();
  for (const msgid in pending) {
    const start = pending[msgid];
    const elapsed = Number(now - start) / 1e6;

    if (elapsed > TIMEOUT_MS) {
      console.log(`Connection ID ${connId},Message ID ${msgid} timed out after ${elapsed.toFixed(2)} ms`);
      delete pending[msgid];
      timeoutcount++;
    }
  }
}, 500);

ws.on('message', (data) => {
  let parsed;

  try { 
    parsed = JSON.parse(data.toString());
  }
  catch {
    console.log(`Connection ID ${connId},Ignored non-JSON message:`, data.toString());
    return;
  }

  const id = parsed.id;
  if (pending[id]) {
    const end = process.hrtime.bigint();
    const latency = Number(end - pending[id]) / 1e6;

    console.log(`Connection id ${connId}, Received response for message ID ${id}:`, parsed.text);
    console.log("Latency:", latency.toFixed(2), "ms");
    delete pending[id];

    //ws.close(); // close ONLY after correct response
  } else {
    console.log("Unknown message:", data.toString());
  }
});

ws.on('error', (err) => {
  console.log("Error:", err.message);
});
}

for(let i=1; i<=NUM_CONNECTIONS; i++) {
  createConnection(i);
}