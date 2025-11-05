import type { Request, Response, NextFunction } from 'express';

type MetricKey = string;

type MetricRecord = {
  method: string;
  route: string;
  count: number;
  errors: number;
  totalTimeMs: number;
  maxTimeMs: number;
};

const metricsStore = new Map<MetricKey, MetricRecord>();

const formatRouteKey = (req: Request, res: Response): MetricKey => {
  const base = req.baseUrl || '';
  const path = req.route?.path || req.path || req.originalUrl || '';
  const route = `${base}${path}`.replace(/\/$/, '') || '/';
  return `${req.method.toUpperCase()} ${route}`;
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const key = formatRouteKey(req, res);

    const existing = metricsStore.get(key);
    const record: MetricRecord = existing
      ? { ...existing }
      : {
          method: req.method.toUpperCase(),
          route: key.split(' ').slice(1).join(' '),
          count: 0,
          errors: 0,
          totalTimeMs: 0,
          maxTimeMs: 0,
        };

    record.count += 1;
    record.totalTimeMs += durationMs;
    record.maxTimeMs = Math.max(record.maxTimeMs, durationMs);
    if (res.statusCode >= 400) {
      record.errors += 1;
    }

    metricsStore.set(key, record);
  });

  next();
};

export const getMetricsSnapshot = () => {
  const routes = Array.from(metricsStore.values()).map((metric) => ({
    method: metric.method,
    route: metric.route || '/',
    count: metric.count,
    errors: metric.errors,
    avgResponseTimeMs: Number((metric.totalTimeMs / Math.max(metric.count, 1)).toFixed(2)),
    maxResponseTimeMs: Number(metric.maxTimeMs.toFixed(2)),
  }));

  const totals = routes.reduce(
    (acc, route) => {
      acc.totalRequests += route.count;
      acc.totalErrors += route.errors;
      acc.totalResponseTimeMs += route.avgResponseTimeMs * route.count;
      return acc;
    },
    { totalRequests: 0, totalErrors: 0, totalResponseTimeMs: 0 },
  );

  const avgResponseTimeMs = totals.totalRequests
    ? Number((totals.totalResponseTimeMs / totals.totalRequests).toFixed(2))
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      totalRequests: totals.totalRequests,
      totalErrors: totals.totalErrors,
      avgResponseTimeMs,
    },
    routes,
  };
};


