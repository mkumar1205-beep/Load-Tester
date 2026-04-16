const WebSocket = require('ws');
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

ws.on('message', (data) => {
  let parsed;

  try { 
    parsed = JSON.parse(data.toString());
  }
  catch {
    console.log("Ignored non-JSON message:", data.toString());
    return;
  }

  const id = parsed.id;
  if (pending[id]) {
    const end = process.hrtime.bigint();
    const latency = Number(end - pending[id]) / 1e6;

    console.log(`Received response for message ID ${id}:`, parsed.text);
    console.log("Latency:", latency.toFixed(2), "ms");

    //ws.close(); // close ONLY after correct response
  } else {
    console.log("Unknown message:", data.toString());
  }
});

ws.on('error', (err) => {
  console.log("Error:", err.message);
});