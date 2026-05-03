let totalmessages = 0;
let totallatency = 0;
let latencies = [];
let timeoutCount = 0;

const cumulative = {
  totalMessages: 0,
  totalLatency: 0,
  allLatencies: [],
  totalTimeouts: 0,
  peakThroughput: 0,
  startTime: Date.now(),
};

function recordLatency(latency) {
  totallatency += latency;
  totalmessages++;
  latencies.push(latency);
  cumulative.totalMessages++;
  cumulative.totalLatency += latency;
  cumulative.allLatencies.push(latency);
}

function recordTimeoutCount() {
  timeoutCount++;
  cumulative.totalTimeouts++;
}

function metricsLogger() {
  setInterval(() => {
    if (latencies.length === 0)  return;
    const averageLatency = totallatency / totalmessages;

    const sorted = [...latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(0.95 * sorted.length);
    const p99Index = Math.floor(0.99 * sorted.length);
    const p95 = sorted[Math.max(0, p95Index)];          // guard against negative
    const p99 = sorted[Math.max(0, p99Index)];
  
    const intervalMS = 1000;
    const throughput = (totalmessages/intervalMS) * 1000;
    const timeoutRate = (timeoutCount / (totalmessages + timeoutCount));
    const time = new Date().toISOString().slice(11, 19);

    if (throughput > cumulative.peakThroughput) {
      cumulative.peakThroughput = throughput;
    }
    console.log("\nMETRICS:");
    console.log(`Throughput: ${throughput} msg/sec`);
    console.log(`Latency: avg ${averageLatency.toFixed(2)} ms | p95 ${p95.toFixed(2)} ms | p99 ${p99.toFixed(2)} ms`);
    console.log(`Timeouts: ${timeoutCount} (${timeoutRate}%)`);

    totalmessages = 0;
    totallatency = 0;
    latencies = [];
    timeoutCount = 0;
  }, 1000);
}


function printFinalReport() {
  const durationSec = ((Date.now() - cumulative.startTime) / 1000).toFixed(1);
  const { totalMessages, totalLatency, allLatencies, totalTimeouts, peakThroughput } = cumulative;

  if (allLatencies.length === 0) {
    console.log("\nNo messages recorded.");
    return;
  }

  const avg = totalLatency / totalMessages;
  const sorted = [...allLatencies].sort((a, b) => a - b);
  const p95 = sorted[Math.max(0, Math.floor(0.95 * sorted.length))];
  const p99 = sorted[Math.max(0, Math.floor(0.99 * sorted.length))];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const timeoutRate = ((totalTimeouts / (totalMessages + totalTimeouts)) * 100).toFixed(1);

  console.log("FINAL REPORT");
  console.log(`Duration         : ${durationSec}s`);
  console.log(`Total messages   : ${totalMessages.toLocaleString()}`);
  console.log(`Peak throughput  : ${peakThroughput} msg/sec`);
  console.log(`Avg latency      : ${avg.toFixed(2)}ms`);
  console.log(`p95 latency      : ${p95.toFixed(2)}ms`);
  console.log(`p99 latency      : ${p99.toFixed(2)}ms`);
  console.log(`Min latency      : ${min.toFixed(2)}ms`);
  console.log(`Max latency      : ${max.toFixed(2)}ms`);
  console.log(`Timeouts         : ${totalTimeouts} (${timeoutRate}%)`);
}

module.exports = {
    recordLatency,
    recordTimeoutCount,
    metricsLogger,
    printFinalReport
};