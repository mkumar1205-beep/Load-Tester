const WebSocket = require('ws');
const ws = new WebSocket('wss://ws.ifelse.io');

let waitingtime = false;
let start;

ws.on('open', () => {
  console.log("Connected to server");
  setInterval(() => {
    const message = "Hello";

    start = process.hrtime.bigint();
    waitingtime = true;

    ws.send(message);
  },1000); // send every 1 second 
});

ws.on('message', (data) => {
  if (waitingtime && data.toString() === "Hello") {
    const end = process.hrtime.bigint();
    const latency = Number(end - start) / 1e6;

    waitingtime = false;

    console.log("Received:", data.toString());
    console.log("Latency:", latency.toFixed(2), "ms");

    //ws.close(); // close ONLY after correct response
  } else {
    console.log("Ignored message:", data.toString());
  }
});

ws.on('error', (err) => {
  console.log("Error:", err.message);
});