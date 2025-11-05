import { getApiUrl } from '@/lib/api';

type WebVitalName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'LongTask';

interface ClientMetric {
  name: WebVitalName;
  value: number;
  detail?: Record<string, unknown>;
  timestamp: string;
}

interface MetricsPayload {
  sessionId: string;
  userAgent: string;
  metrics: ClientMetric[];
}

const metricsBuffer: ClientMetric[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let initialized = false;
const MAX_BUFFER_SIZE = 50;
const FLUSH_INTERVAL_MS = 5000;

const getSessionId = () => {
  const key = 'tw-metrics-session';
  const stored = sessionStorage.getItem(key);
  if (stored) return stored;
  const generated = crypto.randomUUID();
  sessionStorage.setItem(key, generated);
  return generated;
};

const flushMetrics = () => {
  if (metricsBuffer.length === 0) return;

  const payload: MetricsPayload = {
    sessionId: getSessionId(),
    userAgent: navigator.userAgent,
    metrics: metricsBuffer.splice(0, metricsBuffer.length),
  };

  try {
    const baseUrl = getApiUrl();
    const endpoint = `${baseUrl.replace(/\/$/, '')}/metrics/client`;
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        keepalive: true,
      }).catch((error) => {
        if (import.meta.env.DEV) {
          console.warn('[PerfObserver] Error enviando métricas', error);
        }
      });
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[PerfObserver] Error preparando métricas', error);
    }
  }
};

const scheduleFlush = () => {
  if (flushTimeout) return;
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushMetrics();
  }, FLUSH_INTERVAL_MS);
};

const recordMetric = (metric: ClientMetric) => {
  metricsBuffer.push(metric);

  if (metricsBuffer.length >= MAX_BUFFER_SIZE) {
    flushMetrics();
    return;
  }

  scheduleFlush();
};

const observePaint = (entryType: string, name: WebVitalName) => {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      recordMetric({
        name,
        value: entry.entryType === 'largest-contentful-paint' ? entry.startTime : entry.duration,
        detail: {
          size: (entry as any).size,
          identifier: (entry as any).id,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  observer.observe({ type: entryType, buffered: true });
};

const observeLayoutShift = () => {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const layoutShift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }; 
      if (layoutShift && layoutShift.value > 0) {
        recordMetric({
          name: 'CLS',
          value: layoutShift.value,
          detail: {
            hadRecentInput: layoutShift.hadRecentInput,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  });

  observer.observe({ type: 'layout-shift', buffered: true });
};

const observeLongTasks = () => {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      recordMetric({
        name: 'LongTask',
        value: entry.duration,
        detail: {
          attribution: (entry as any).attribution,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  observer.observe({ type: 'longtask', buffered: true });
};

const observeFirstInputDelay = () => {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const input = entry as PerformanceEventTiming;
      recordMetric({
        name: 'FID',
        value: input.processingStart - input.startTime,
        detail: {
          name: input.name,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  observer.observe({ type: 'first-input', buffered: true });
};

export const initPerformanceObservers = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  observePaint('largest-contentful-paint', 'LCP');
  observePaint('first-contentful-paint', 'FCP');
  observeLayoutShift();
  observeLongTasks();
  observeFirstInputDelay();

  window.addEventListener('beforeunload', flushMetrics);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushMetrics();
    }
  });
};


