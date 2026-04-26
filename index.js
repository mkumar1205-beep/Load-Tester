const WebSocket = require('ws');
const metrics = require('./metrics');

//env-based config
const targetURL = process.env.targetURL || "ws://localhost:9000";
const numConnections = Number(process.env.numconnections || 5);
const timeoutMS = Number(process.env.timeoutMS || 2000);
const sendIntervalMS = Number(process.env.sendIntervalMS || 1000);
const timeoutCheckMS = Number(process.env.timeoutCheckMS || 500);
const testDuration = Number(process.env.testDuration || 30);

metrics.metricsLogger();

const sockets = [];
let isStopping = false;

function createConnection(connId)
{
const ws = new WebSocket(targetURL);

let msgid = 0;
const pending = {};

let sendIntervalId = null;
let timeoutIntervalId = null;

ws.on('open', () => {
  console.log(`Connection ${connId} connected`);
  sendIntervalId = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) return;
    msgid++;
    const message = JSON.stringify({ id : msgid, text: "Hello" });

    let start = process.hrtime.bigint();
    pending[msgid] = start;

    ws.send(message);
  }, sendIntervalMS); // send every 1 second 
});

timeoutIntervalId = setInterval(() => {
  const now = process.hrtime.bigint();
  for (const msgid in pending) {
    const start = pending[msgid];
    const elapsed = Number(now - start) / 1e6;

    if (elapsed > timeoutMS) {
      delete pending[msgid];
      metrics.recordTimeoutCount();
    }
  }
}, timeoutCheckMS);

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
    metrics.recordLatency(latency);
    delete pending[id];
    //ws.close(); // close ONLY after correct response
  } else {
    console.log("Unknown message:", data.toString());
  }
});

ws.on('error', (err) => {
  console.log("Error:", err.message);
});

ws.on("close", (code, reason) => {
    console.log(
      `Connection ${connId} closed. Code=${code}, Reason=${reason?.toString() || "N/A"}`
    );

    if (sendIntervalId) clearInterval(sendIntervalId);
    if (timeoutIntervalId) clearInterval(timeoutIntervalId);
  });

  sockets.push(ws);
}

for(let i=1; i <= numConnections; i++) {
  createConnection(i);
}

setTimeout(() => {
  if (isStopping) return;
  isStopping = true;

  console.log(`\nStopping test after ${testDuration} seconds...`);

  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close(1000, "Test finished");
    }
  }

  setTimeout(() => {
    console.log(metrics.printFinalReport());
    console.log("Test stopped.");
    process.exit(0);
  }, 1000);
}, testDuration * 1000);
