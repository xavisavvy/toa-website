import { type Express } from "express";
import os from "os";
import fs from "fs/promises";
import { storage } from "./storage";
import { metrics } from "./monitoring";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface ComponentHealth {
  status: HealthStatus;
  message?: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    storage: ComponentHealth;
    cache: ComponentHealth;
    memory: ComponentHealth;
    disk: ComponentHealth;
    cpu: ComponentHealth;
  };
}

async function checkStorage(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    // Test storage read operation
    await storage.getUserByUsername("health-check-test-user");
    const responseTime = Date.now() - start;
    
    if (responseTime > 1000) {
      return {
        status: "degraded",
        message: "Storage responding slowly",
        responseTime,
        details: { threshold: "1000ms" }
      };
    }
    
    return {
      status: "healthy",
      message: "Storage operational",
      responseTime
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: "Storage unavailable",
      responseTime: Date.now() - start,
      details: { error: error instanceof Error ? error.message : "Unknown error" }
    };
  }
}

async function checkCache(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const cacheMetrics = metrics.getMetrics().cache;
    const responseTime = Date.now() - start;
    
    // Calculate cache hit rate
    const total = cacheMetrics.hits + cacheMetrics.misses;
    const hitRate = total > 0 ? (cacheMetrics.hits / total) * 100 : 0;
    
    if (hitRate < 50 && total > 100) {
      return {
        status: "degraded",
        message: "Low cache hit rate",
        responseTime,
        details: {
          hitRate: `${hitRate.toFixed(2)}%`,
          hits: cacheMetrics.hits,
          misses: cacheMetrics.misses
        }
      };
    }
    
    return {
      status: "healthy",
      message: "Cache operational",
      responseTime,
      details: {
        hitRate: `${hitRate.toFixed(2)}%`,
        entries: cacheMetrics.sets - cacheMetrics.deletes
      }
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: "Cache check failed",
      responseTime: Date.now() - start,
      details: { error: error instanceof Error ? error.message : "Unknown error" }
    };
  }
}

function checkMemory(): ComponentHealth {
  const start = Date.now();
  try {
    const used = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedPercent = ((totalMem - freeMem) / totalMem) * 100;
    const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;
    
    const responseTime = Date.now() - start;
    
    // Critical: >90% heap usage
    if (heapUsedPercent > 90) {
      return {
        status: "unhealthy",
        message: "Critical memory usage",
        responseTime,
        details: {
          heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
          heapUsedPercent: `${heapUsedPercent.toFixed(2)}%`,
          systemUsedPercent: `${usedPercent.toFixed(2)}%`
        }
      };
    }
    
    // Warning: >75% heap usage
    if (heapUsedPercent > 75) {
      return {
        status: "degraded",
        message: "High memory usage",
        responseTime,
        details: {
          heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
          heapUsedPercent: `${heapUsedPercent.toFixed(2)}%`,
          systemUsedPercent: `${usedPercent.toFixed(2)}%`
        }
      };
    }
    
    return {
      status: "healthy",
      message: "Memory usage normal",
      responseTime,
      details: {
        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
        heapUsedPercent: `${heapUsedPercent.toFixed(2)}%`,
        rss: `${Math.round(used.rss / 1024 / 1024)}MB`
      }
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: "Memory check failed",
      responseTime: Date.now() - start,
      details: { error: error instanceof Error ? error.message : "Unknown error" }
    };
  }
}

async function checkDisk(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    // Check if we can write to the cache directory
    const testPath = "./server/cache/.health-check";
    
    await fs.mkdir("./server/cache", { recursive: true });
    await fs.writeFile(testPath, Date.now().toString());
    await fs.unlink(testPath);
    
    const responseTime = Date.now() - start;
    
    // If write took too long, disk might be slow
    if (responseTime > 500) {
      return {
        status: "degraded",
        message: "Slow disk I/O",
        responseTime,
        details: { threshold: "500ms" }
      };
    }
    
    return {
      status: "healthy",
      message: "Disk I/O operational",
      responseTime
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: "Disk I/O failed",
      responseTime: Date.now() - start,
      details: { error: error instanceof Error ? error.message : "Unknown error" }
    };
  }
}

function checkCPU(): ComponentHealth {
  const start = Date.now();
  try {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const numCPUs = cpus.length;
    
    // Load average normalized by CPU count
    const normalizedLoad = loadAvg[0] / numCPUs;
    
    const responseTime = Date.now() - start;
    
    // Critical: Load > 2x CPU count
    if (normalizedLoad > 2) {
      return {
        status: "unhealthy",
        message: "Critical CPU load",
        responseTime,
        details: {
          loadAvg1m: loadAvg[0].toFixed(2),
          loadAvg5m: loadAvg[1].toFixed(2),
          loadAvg15m: loadAvg[2].toFixed(2),
          cpuCount: numCPUs,
          normalizedLoad: normalizedLoad.toFixed(2)
        }
      };
    }
    
    // Warning: Load > 1x CPU count
    if (normalizedLoad > 1) {
      return {
        status: "degraded",
        message: "High CPU load",
        responseTime,
        details: {
          loadAvg1m: loadAvg[0].toFixed(2),
          loadAvg5m: loadAvg[1].toFixed(2),
          loadAvg15m: loadAvg[2].toFixed(2),
          cpuCount: numCPUs,
          normalizedLoad: normalizedLoad.toFixed(2)
        }
      };
    }
    
    return {
      status: "healthy",
      message: "CPU load normal",
      responseTime,
      details: {
        loadAvg1m: loadAvg[0].toFixed(2),
        cpuCount: numCPUs,
        normalizedLoad: normalizedLoad.toFixed(2)
      }
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: "CPU check failed",
      responseTime: Date.now() - start,
      details: { error: error instanceof Error ? error.message : "Unknown error" }
    };
  }
}

function determineOverallStatus(checks: HealthCheckResponse["checks"]): HealthStatus {
  const statuses = Object.values(checks).map(check => check.status);
  
  if (statuses.some(s => s === "unhealthy")) {
    return "unhealthy";
  }
  
  if (statuses.some(s => s === "degraded")) {
    return "degraded";
  }
  
  return "healthy";
}

export async function getHealthStatus(): Promise<HealthCheckResponse> {
  const checks = {
    storage: await checkStorage(),
    cache: await checkCache(),
    memory: checkMemory(),
    disk: await checkDisk(),
    cpu: checkCPU()
  };
  
  const status = determineOverallStatus(checks);
  
  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checks
  };
}

export function registerHealthRoutes(app: Express): void {
  // Comprehensive health check - returns detailed status
  app.get("/api/health", async (req, res) => {
    try {
      const health = await getHealthStatus();
      
      // Return 503 if unhealthy, 200 otherwise
      const statusCode = health.status === "unhealthy" ? 503 : 200;
      
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Health check failed"
      });
    }
  });
  
  // Kubernetes readiness probe - determines if pod can receive traffic
  app.get("/api/ready", async (req, res) => {
    try {
      // Check critical components only
      const [storageCheck, cacheCheck] = await Promise.all([
        checkStorage(),
        checkCache()
      ]);
      
      const isReady = 
        storageCheck.status !== "unhealthy" && 
        cacheCheck.status !== "unhealthy";
      
      if (isReady) {
        res.status(200).json({ 
          ready: true,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({ 
          ready: false,
          timestamp: new Date().toISOString(),
          checks: {
            storage: storageCheck.status,
            cache: cacheCheck.status
          }
        });
      }
    } catch (error) {
      res.status(503).json({ 
        ready: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Readiness check failed"
      });
    }
  });
  
  // Kubernetes liveness probe - determines if pod should be restarted
  app.get("/api/alive", (req, res) => {
    // Simple check - if we can respond, we're alive
    res.status(200).json({ 
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // Startup probe - for slow-starting applications
  app.get("/api/startup", async (req, res) => {
    try {
      // Check if application has fully initialized
      const storageCheck = await checkStorage();
      const isStarted = storageCheck.status !== "unhealthy";
      
      if (isStarted) {
        res.status(200).json({ 
          started: true,
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        });
      } else {
        res.status(503).json({ 
          started: false,
          timestamp: new Date().toISOString(),
          message: "Application still initializing"
        });
      }
    } catch (error) {
      res.status(503).json({ 
        started: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Startup check failed"
      });
    }
  });
}
