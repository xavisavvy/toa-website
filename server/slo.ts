/**
 * SLO (Service Level Objective) Tracking
 *
 * Track availability, latency, and error budget for the application.
 * Provides metrics for observability dashboards and alerting.
 *
 * SLO Targets:
 * - Availability: 99.9% (43.2 minutes downtime/month allowed)
 * - Latency p95: < 200ms
 * - Error Rate: < 0.1%
 *
 * @example
 * import { sloTracker, trackRequest, getSLOMetrics } from './slo';
 *
 * // Middleware to track all requests
 * app.use(sloTracker());
 *
 * // Get current SLO status
 * const metrics = getSLOMetrics();
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

// ============================================
// SLO Configuration
// ============================================

export interface SLOConfig {
  // Availability: percentage of successful requests
  availabilityTarget: number; // 0.999 = 99.9%

  // Latency: p95 response time in milliseconds
  latencyP95Target: number; // 200ms

  // Error Rate: percentage of 5xx responses
  errorRateTarget: number; // 0.001 = 0.1%

  // Window for calculations
  windowMs: number; // 1 hour default
}

const DEFAULT_CONFIG: SLOConfig = {
  availabilityTarget: 0.999, // 99.9%
  latencyP95Target: 200, // 200ms
  errorRateTarget: 0.001, // 0.1%
  windowMs: 60 * 60 * 1000, // 1 hour
};

// ============================================
// Metrics Storage
// ============================================

interface RequestMetric {
  timestamp: number;
  duration: number;
  statusCode: number;
  path: string;
  method: string;
}

// Circular buffer for request metrics
const MAX_METRICS = 10000;
const metrics: RequestMetric[] = [];
let metricsIndex = 0;

// Track start time
const startTime = Date.now();

// ============================================
// Core Functions
// ============================================

/**
 * Record a request metric
 */
function recordMetric(metric: RequestMetric): void {
  metrics[metricsIndex] = metric;
  metricsIndex = (metricsIndex + 1) % MAX_METRICS;
}

/**
 * Get metrics within the time window
 */
function getMetricsInWindow(windowMs: number): RequestMetric[] {
  const cutoff = Date.now() - windowMs;
  return metrics.filter((m) => m && m.timestamp >= cutoff);
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

// ============================================
// SLO Calculations
// ============================================

export interface SLOMetrics {
  // Current metrics
  availability: number; // Percentage of successful requests
  latencyP50: number; // Median latency
  latencyP95: number; // 95th percentile latency
  latencyP99: number; // 99th percentile latency
  errorRate: number; // Percentage of 5xx errors

  // SLO Status
  availabilityBudgetRemaining: number; // Percentage of error budget remaining
  latencyBudgetRemaining: number; // Percentage within target
  errorBudgetRemaining: number; // Percentage of error budget remaining

  // SLO Compliance
  availabilityMet: boolean;
  latencyMet: boolean;
  errorRateMet: boolean;
  allSLOsMet: boolean;

  // Metadata
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  windowMs: number;
  uptimeMs: number;
  config: SLOConfig;
}

/**
 * Calculate current SLO metrics
 */
export function getSLOMetrics(config: SLOConfig = DEFAULT_CONFIG): SLOMetrics {
  const windowMetrics = getMetricsInWindow(config.windowMs);
  const totalRequests = windowMetrics.length;

  if (totalRequests === 0) {
    return {
      availability: 1,
      latencyP50: 0,
      latencyP95: 0,
      latencyP99: 0,
      errorRate: 0,
      availabilityBudgetRemaining: 100,
      latencyBudgetRemaining: 100,
      errorBudgetRemaining: 100,
      availabilityMet: true,
      latencyMet: true,
      errorRateMet: true,
      allSLOsMet: true,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      windowMs: config.windowMs,
      uptimeMs: Date.now() - startTime,
      config,
    };
  }

  // Calculate success/failure counts
  const failedRequests = windowMetrics.filter((m) => m.statusCode >= 500).length;
  const successfulRequests = totalRequests - failedRequests;

  // Availability
  const availability = successfulRequests / totalRequests;
  const availabilityBudget = 1 - config.availabilityTarget; // e.g., 0.001 for 99.9%
  const availabilityUsed = 1 - availability;
  const availabilityBudgetRemaining = Math.max(
    0,
    ((availabilityBudget - availabilityUsed) / availabilityBudget) * 100
  );

  // Latency
  const durations = windowMetrics.map((m) => m.duration).sort((a, b) => a - b);
  const latencyP50 = percentile(durations, 50);
  const latencyP95 = percentile(durations, 95);
  const latencyP99 = percentile(durations, 99);
  const latencyBudgetRemaining =
    latencyP95 <= config.latencyP95Target
      ? 100
      : Math.max(0, ((config.latencyP95Target * 2 - latencyP95) / config.latencyP95Target) * 100);

  // Error Rate
  const errorRate = failedRequests / totalRequests;
  const errorBudget = config.errorRateTarget;
  const errorBudgetRemaining = Math.max(0, ((errorBudget - errorRate) / errorBudget) * 100);

  // SLO Compliance
  const availabilityMet = availability >= config.availabilityTarget;
  const latencyMet = latencyP95 <= config.latencyP95Target;
  const errorRateMet = errorRate <= config.errorRateTarget;

  return {
    availability,
    latencyP50,
    latencyP95,
    latencyP99,
    errorRate,
    availabilityBudgetRemaining,
    latencyBudgetRemaining,
    errorBudgetRemaining,
    availabilityMet,
    latencyMet,
    errorRateMet,
    allSLOsMet: availabilityMet && latencyMet && errorRateMet,
    totalRequests,
    successfulRequests,
    failedRequests,
    windowMs: config.windowMs,
    uptimeMs: Date.now() - startTime,
    config,
  };
}

// ============================================
// Express Middleware
// ============================================

/**
 * Express middleware to track SLO metrics
 */
export function sloTracker(config: SLOConfig = DEFAULT_CONFIG): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Track response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      recordMetric({
        timestamp: Date.now(),
        duration,
        statusCode: res.statusCode,
        path: req.path,
        method: req.method,
      });

      // Log warning if SLO budget is running low
      const metrics = getSLOMetrics(config);
      if (metrics.totalRequests > 100) {
        // Only check after sufficient data
        if (metrics.availabilityBudgetRemaining < 20) {
          console.warn(
            `[SLO] Availability budget low: ${metrics.availabilityBudgetRemaining.toFixed(1)}% remaining`
          );
        }
        if (metrics.errorBudgetRemaining < 20) {
          console.warn(
            `[SLO] Error budget low: ${metrics.errorBudgetRemaining.toFixed(1)}% remaining`
          );
        }
      }
    });

    next();
  };
}

/**
 * Track a single request manually
 */
export function trackRequest(
  duration: number,
  statusCode: number,
  path: string,
  method: string
): void {
  recordMetric({
    timestamp: Date.now(),
    duration,
    statusCode,
    path,
    method,
  });
}

// ============================================
// API Endpoint Handler
// ============================================

/**
 * Express route handler for SLO metrics endpoint
 * GET /api/slo
 */
export function sloEndpoint(config: SLOConfig = DEFAULT_CONFIG): RequestHandler {
  return (_req: Request, res: Response) => {
    const metrics = getSLOMetrics(config);

    res.json({
      status: metrics.allSLOsMet ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      slo: {
        availability: {
          current: `${(metrics.availability * 100).toFixed(3)}%`,
          target: `${(config.availabilityTarget * 100).toFixed(1)}%`,
          met: metrics.availabilityMet,
          budgetRemaining: `${metrics.availabilityBudgetRemaining.toFixed(1)}%`,
        },
        latency: {
          p50: `${metrics.latencyP50.toFixed(0)}ms`,
          p95: `${metrics.latencyP95.toFixed(0)}ms`,
          p99: `${metrics.latencyP99.toFixed(0)}ms`,
          target: `${config.latencyP95Target}ms`,
          met: metrics.latencyMet,
          budgetRemaining: `${metrics.latencyBudgetRemaining.toFixed(1)}%`,
        },
        errorRate: {
          current: `${(metrics.errorRate * 100).toFixed(3)}%`,
          target: `${(config.errorRateTarget * 100).toFixed(2)}%`,
          met: metrics.errorRateMet,
          budgetRemaining: `${metrics.errorBudgetRemaining.toFixed(1)}%`,
        },
      },
      requests: {
        total: metrics.totalRequests,
        successful: metrics.successfulRequests,
        failed: metrics.failedRequests,
        window: `${Math.round(metrics.windowMs / 60000)} minutes`,
      },
      uptime: {
        ms: metrics.uptimeMs,
        formatted: formatUptime(metrics.uptimeMs),
      },
    });
  };
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// ============================================
// Alerting Helpers
// ============================================

export interface SLOAlert {
  type: 'availability' | 'latency' | 'error_rate';
  severity: 'warning' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
  budgetRemaining: number;
}

/**
 * Check for SLO violations and return alerts
 */
export function checkSLOAlerts(config: SLOConfig = DEFAULT_CONFIG): SLOAlert[] {
  const metrics = getSLOMetrics(config);
  const alerts: SLOAlert[] = [];

  // Only check if we have enough data
  if (metrics.totalRequests < 100) {
    return alerts;
  }

  // Availability alerts
  if (metrics.availabilityBudgetRemaining < 10) {
    alerts.push({
      type: 'availability',
      severity: 'critical',
      message: `Availability budget critically low: ${metrics.availabilityBudgetRemaining.toFixed(1)}% remaining`,
      currentValue: metrics.availability,
      threshold: config.availabilityTarget,
      budgetRemaining: metrics.availabilityBudgetRemaining,
    });
  } else if (metrics.availabilityBudgetRemaining < 30) {
    alerts.push({
      type: 'availability',
      severity: 'warning',
      message: `Availability budget running low: ${metrics.availabilityBudgetRemaining.toFixed(1)}% remaining`,
      currentValue: metrics.availability,
      threshold: config.availabilityTarget,
      budgetRemaining: metrics.availabilityBudgetRemaining,
    });
  }

  // Latency alerts
  if (!metrics.latencyMet) {
    alerts.push({
      type: 'latency',
      severity: metrics.latencyP95 > config.latencyP95Target * 2 ? 'critical' : 'warning',
      message: `Latency p95 (${metrics.latencyP95.toFixed(0)}ms) exceeds target (${config.latencyP95Target}ms)`,
      currentValue: metrics.latencyP95,
      threshold: config.latencyP95Target,
      budgetRemaining: metrics.latencyBudgetRemaining,
    });
  }

  // Error rate alerts
  if (metrics.errorBudgetRemaining < 10) {
    alerts.push({
      type: 'error_rate',
      severity: 'critical',
      message: `Error budget critically low: ${metrics.errorBudgetRemaining.toFixed(1)}% remaining`,
      currentValue: metrics.errorRate,
      threshold: config.errorRateTarget,
      budgetRemaining: metrics.errorBudgetRemaining,
    });
  } else if (metrics.errorBudgetRemaining < 30) {
    alerts.push({
      type: 'error_rate',
      severity: 'warning',
      message: `Error budget running low: ${metrics.errorBudgetRemaining.toFixed(1)}% remaining`,
      currentValue: metrics.errorRate,
      threshold: config.errorRateTarget,
      budgetRemaining: metrics.errorBudgetRemaining,
    });
  }

  return alerts;
}

/**
 * Reset metrics (for testing)
 */
export function resetMetrics(): void {
  metrics.length = 0;
  metricsIndex = 0;
}
