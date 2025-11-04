type ClientMetricName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'LongTask';

export interface ClientMetricInput {
  sessionId: string;
  userAgent?: string;
  metrics: Array<{
    name: ClientMetricName;
    value: number;
    detail?: Record<string, unknown>;
    timestamp?: string;
  }>;
}

export interface ClientMetricRecord {
  sessionId: string;
  userAgent?: string;
  name: ClientMetricName;
  value: number;
  detail?: Record<string, unknown>;
  timestamp: string;
  receivedAt: string;
}

const MAX_METRICS = 500;
const metricsStore: ClientMetricRecord[] = [];

export const addClientMetrics = (payload: ClientMetricInput) => {
  const receivedAt = new Date().toISOString();

  if (!payload || !Array.isArray(payload.metrics)) {
    return;
  }

  payload.metrics.forEach((metric) => {
    metricsStore.push({
      sessionId: payload.sessionId,
      userAgent: payload.userAgent,
      name: metric.name,
      value: metric.value,
      detail: metric.detail,
      timestamp: metric.timestamp || receivedAt,
      receivedAt,
    });
  });

  if (metricsStore.length > MAX_METRICS) {
    metricsStore.splice(0, metricsStore.length - MAX_METRICS);
  }
};

export const getClientMetrics = (limit = 100) => {
  const slice = metricsStore.slice(-limit);
  const groupedByName = slice.reduce<Record<ClientMetricName, { count: number; avg: number; max: number }>>(
    (acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = { count: 0, avg: 0, max: 0 };
      }

      const bucket = acc[metric.name];
      bucket.count += 1;
      bucket.avg += metric.value;
      bucket.max = Math.max(bucket.max, metric.value);

      return acc;
    },
    {} as Record<ClientMetricName, { count: number; avg: number; max: number }>);

  Object.entries(groupedByName).forEach(([name, bucket]) => {
    bucket.avg = Number((bucket.avg / Math.max(bucket.count, 1)).toFixed(2));
    bucket.max = Number(bucket.max.toFixed(2));
  });

  return {
    generatedAt: new Date().toISOString(),
    total: metricsStore.length,
    recent: slice.slice().reverse(),
    summary: groupedByName,
  };
};


