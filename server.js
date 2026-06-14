const express = require('express');
const os = require('os');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Prometheus setup ---
const register = client.register;

// Collects process/runtime metrics: CPU usage, memory, event loop lag, GC, etc.
client.collectDefaultMetrics({ register });

// Histogram of request durations, useful for latency dashboards/alerts
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

// Counter of total requests, useful for request-rate/error-rate dashboards
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);

// Middleware: record duration + count for every request
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    // Use the matched route pattern (e.g. "/users/:id") rather than the raw
    // path, so metrics don't explode in cardinality for dynamic routes.
    const route = req.route ? req.route.path : req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };

    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);
  });

  next();
});

// --- Routes ---
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from your Node.js app!',
    hostname: os.hostname(),
    timestamp: new Date().toISOString(),
  });
});

// Used by Docker HEALTHCHECK and Kubernetes liveness/readiness probes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Scraped by Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
