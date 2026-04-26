# ws-load-tester

A CLI-based WebSocket load testing tool built with Node.js. Simulates multiple concurrent WebSocket connections against a target server and reports real-time latency, throughput, and timeout metrics — helping you find where your server starts to degrade under pressure.

---

## Features

- Simulate hundreds of concurrent WebSocket connections
- Real-time per-second metrics (throughput, avg/p95/p99 latency, timeouts)
- Final summary report at the end of each test run
- Timeout detection — messages that never receive a response are tracked separately
- Fully configurable via environment variables
- Preset test tiers (light / medium / heavy) via npm scripts

---

## Project Structure

```
ws-load-tester/
├── index.js          # entry point — spawns connections, manages test lifecycle
├── metrics.js        # tracks and reports latency, throughput, and timeouts
├── dummy-server.js   # simple echo server for local testing
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v14+
- npm

### Install dependencies

```bash
npm install
```

---

## Running Tests

Start the dummy echo server in one terminal:

```bash
node dummy-server.js
```

Run a test preset in another terminal:

```bash
npm run test:light
npm run test:medium
npm run test:heavy
```

---

## Test Presets

| Preset | Connections | Send Interval | Total Msg/sec | Duration |
|---|---|---|---|---|
| `test:light` | 5 | 1000ms | ~5 | 20s |
| `test:medium` | 25 | 500ms | ~50 | 30s |
| `test:heavy` | 100 | 200ms | ~500 | 45s |

---

## Configuration

All parameters are set via environment variables. You can override any preset by passing them directly:

```bash
cross-env TARGET_URL=ws://localhost:9000 NUM_CONNECTIONS=200 SEND_INTERVAL_MS=100 TEST_DURATION_SEC=60 node index.js
```

| Variable | Default | Description |
|---|---|---|
| `TARGET_URL` | `ws://localhost:9000` | WebSocket server URL to test against |
| `NUM_CONNECTIONS` | `5` | Number of concurrent connections |
| `SEND_INTERVAL_MS` | `1000` | How often each connection sends a message (ms) |
| `TIMEOUT_MS` | `2000` | How long before a message is considered timed out |
| `TIMEOUT_CHECK_MS` | `500` | How often to check for timed out messages |
| `TEST_DURATION_SEC` | `30` | How long the test runs (seconds) |

---

## Understanding the Output

### Live metrics (per second)

```
METRICS [14:23:01]:
Throughput : 500 msg/sec
Latency    : avg 2.30ms | p95 4.87ms | p99 6.50ms
Timeouts   : 0 (0.0%)
```

### Final report

```
════════════════════════════════════════
           FINAL REPORT
════════════════════════════════════════
Duration         : 45.1s
Total messages   : 22,500
Peak throughput  : 500 msg/sec
────────────────────────────────────────
Avg latency      : 2.43ms
p95 latency      : 5.12ms
p99 latency      : 8.67ms
Min latency      : 0.55ms
Max latency      : 18.48ms
────────────────────────────────────────
Timeouts         : 0 (0.0%)
════════════════════════════════════════
```

### What to watch for

| Signal | Meaning |
|---|---|
| Avg latency climbing steadily | Server getting slower under load |
| p99 diverging far from avg | Occasional bad outliers, queue building up |
| Throughput dropping below expected | Node.js event loop struggling on client side |
| Timeouts > 0% | Server starting to drop messages |
| Connections failing to open | Server hit its connection limit |

---

## Metrics Explained

**Throughput** — number of round-trips completed in that second. Lower than expected means either the server is slow to respond or the client event loop is under pressure.

**avg latency** — average round-trip time across all messages in that window. Good for general health.

**p95 latency** — 95% of messages were faster than this. Represents your typical slow case.

**p99 latency** — 99% of messages were faster than this. Represents your worst case. A large gap between p95 and p99 means occasional severe slowdowns even if avg looks healthy.

**Timeouts** — messages sent but never echoed back within `TIMEOUT_MS`. A timeout rate above 0% means the server is dropping or ignoring messages under load.

---

## Dummy Server

`dummy-server.js` is a minimal WebSocket echo server for local testing. It accepts any number of connections and echoes every message straight back, making it the ideal baseline target.

```bash
node dummy-server.js
# 🟢 Dummy WS server running on ws://localhost:9000
```

---

## What I Learned Building This

- How the WebSocket protocol works at the connection level
- How to measure round-trip latency accurately using `process.hrtime.bigint()`
- The difference between windowed metrics and cumulative metrics
- How Node.js event loop jitter affects timing under load
- Why p99 matters more than averages for real-world performance
- How backpressure and timeout detection work in practice
