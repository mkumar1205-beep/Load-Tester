let totalmessages = 0;
let totallatency = 0;
let latencies = [];
let timeoutCount = 0;

function recordLatency(latency) {
  totallatency += latency;
  totalmessages++;
  latencies.push(latency);
}

function recordTimeoutCount() {
  timeoutCount++;
}

function metricsLogger() {
  setInterval(() => {
    if (latencies.length === 0)  return;
    const averageLatency = totallatency / totalmessages;

    const sorted = [...latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(0.95 * sorted.length);
    const p99Index = Math.floor(0.99 * sorted.length);
    let p95 = sorted[Math.max(0, p95Index)];          // guard against negative
    let p99 = sorted[Math.max(0, p99Index)];
    p95 = sorted[p95Index];
    p99 = sorted[p99Index];

    const intervalMS = 1000;
    const throughput = (totalmessages/intervalMS) * 1000;

    console.log("\nMETRICS:");
    console.log(`Throughput: ${throughput} msg/sec`);
    console.log(`Latency: avg ${averageLatency.toFixed(2)} ms | p95 ${p95.toFixed(2)} ms | p99 ${p99.toFixed(2)} ms`);
    console.log(`Timeouts: ${timeoutCount}`);
    console.log("\n");

    totalmessages = 0;
    totallatency = 0;
    latencies = [];
    timeoutCount = 0;
  }, 1000);
}

module.exports = {
    recordLatency,
    recordTimeoutCount,
    metricsLogger
};