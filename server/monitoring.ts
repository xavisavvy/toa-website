import { performance } from 'perf_hooks';

export interface ApiMetrics {
  endpoint: string;
  duration: number;
  timestamp: number;
  status: 'success' | 'error';
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}

export interface ErrorMetrics {
  errors: number;
  errorsByType: Map<string, number>;
}

class MetricsCollector {
  private apiLatency: Map<string, number[]> = new Map();
  private cacheMetrics: CacheMetrics = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  private errorMetrics: ErrorMetrics = { 
    errors: 0, 
    errorsByType: new Map() 
  };
  private requestCount = 0;
  private startTime = Date.now();

  trackApiCall(endpoint: string, duration: number, status: 'success' | 'error' = 'success') {
    if (!this.apiLatency.has(endpoint)) {
      this.apiLatency.set(endpoint, []);
    }
    
    const latencies = this.apiLatency.get(endpoint)!;
    latencies.push(duration);
    
    // Keep only last 1000 measurements per endpoint
    if (latencies.length > 1000) {
      latencies.shift();
    }
    
    this.requestCount++;
    if (status === 'error') {
      this.errorMetrics.errors++;
    }
  }

  trackCacheHit() {
    this.cacheMetrics.hits++;
  }

  trackCacheMiss() {
    this.cacheMetrics.misses++;
  }

  trackCacheSet() {
    this.cacheMetrics.sets++;
  }

  trackCacheDelete() {
    this.cacheMetrics.deletes++;
  }

  trackError(errorType: string) {
    this.errorMetrics.errors++;
    
    const count = this.errorMetrics.errorsByType.get(errorType) || 0;
    this.errorMetrics.errorsByType.set(errorType, count + 1);
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const cacheHitRate = this.cacheMetrics.hits + this.cacheMetrics.misses > 0
      ? this.cacheMetrics.hits / (this.cacheMetrics.hits + this.cacheMetrics.misses)
      : 0;

    const latencyStats: Record<string, any> = {};
    for (const [endpoint, values] of this.apiLatency.entries()) {
      if (values.length > 0) {
        latencyStats[endpoint] = {
          count: values.length,
          p50: this.percentile(values, 50),
          p95: this.percentile(values, 95),
          p99: this.percentile(values, 99),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    }

    return {
      uptime,
      requests: {
        total: this.requestCount,
        rps: this.requestCount / (uptime / 1000),
      },
      cache: {
        hitRate: cacheHitRate,
        hits: this.cacheMetrics.hits,
        misses: this.cacheMetrics.misses,
        sets: this.cacheMetrics.sets,
        deletes: this.cacheMetrics.deletes,
      },
      errors: {
        rate: this.requestCount > 0 
          ? this.errorMetrics.errors / this.requestCount 
          : 0,
        total: this.errorMetrics.errors,
        byType: Object.fromEntries(this.errorMetrics.errorsByType),
      },
      latency: latencyStats,
    };
  }

  reset() {
    this.apiLatency.clear();
    this.cacheMetrics = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    this.errorMetrics = { errors: 0, errorsByType: new Map() };
    this.requestCount = 0;
    this.startTime = Date.now();
  }
}

export const metrics = new MetricsCollector();

// Middleware to track API calls
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    const endpoint = `${req.method} ${req.path}`;
    const status = res.statusCode >= 400 ? 'error' : 'success';
    
    metrics.trackApiCall(endpoint, duration, status);
    
    if (status === 'error') {
      metrics.trackError(`HTTP_${res.statusCode}`);
    }
  });
  
  next();
}
