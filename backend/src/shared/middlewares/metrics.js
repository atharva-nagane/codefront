// E:\online-judge\backend\src\shared\middlewares\metrics.js
// Lightweight, dependency-free in-memory request metrics — no Prometheus
// needed for v1 (mention as a future step), just enough to answer
// "how's the API doing right now" without digging through logs.
const MAX_SAMPLES = 1000;

const state = {
  requestCount: 0,
  errorCount: 0,
  totalDurationMs: 0,
  durations: [],
};

const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    state.requestCount += 1;
    state.totalDurationMs += durationMs;
    state.durations.push(durationMs);
    if (state.durations.length > MAX_SAMPLES) state.durations.shift();

    if (res.statusCode >= 500) state.errorCount += 1;
  });

  next();
};

const percentile = (sortedArr, p) => {
  if (sortedArr.length === 0) return 0;
  const idx = Math.min(Math.floor((p / 100) * sortedArr.length), sortedArr.length - 1);
  return Math.round(sortedArr[idx] * 100) / 100;
};

const getMetricsSnapshot = () => {
  const sorted = [...state.durations].sort((a, b) => a - b);
  return {
    requestCount: state.requestCount,
    errorCount: state.errorCount,
    errorRate: state.requestCount ? Number((state.errorCount / state.requestCount).toFixed(4)) : 0,
    avgLatencyMs: state.requestCount ? Math.round((state.totalDurationMs / state.requestCount) * 100) / 100 : 0,
    p50LatencyMs: percentile(sorted, 50),
    p95LatencyMs: percentile(sorted, 95),
    p99LatencyMs: percentile(sorted, 99),
    sampleSize: state.durations.length,
  };
};

module.exports = { metricsMiddleware, getMetricsSnapshot };
