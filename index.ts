import 'dotenv/config';
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

import express, { type Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

import { registerRoutes } from "./server/routes";
import { configureSecurity } from "./server/security";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Trust proxy - required for rate limiting behind reverse proxy (Replit, etc.)
app.set('trust proxy', 1);

// A05: Security Misconfiguration - Apply security middleware FIRST
configureSecurity(app);

// Stripe webhook must receive raw body for signature verification
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Body parsing middleware (with size limits) - applied to all OTHER routes
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Health check endpoint for Autoscale Deployments (on /health to not interfere with homepage)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'Tales of Aneria',
    timestamp: new Date().toISOString()
  });
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = `${logLine.slice(0, 79)  }…`;
      }

      console.info(logLine);
    }
  });

  next();
});

// Register API routes and start server
(async () => {
  await registerRoutes(app);

  // Determine environment and setup accordingly
  const isReplitDeployment = !!process.env.REPLIT_DEPLOYMENT;
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Setup static file serving for production builds (Replit Deployment or production mode)
  if (isProduction || isReplitDeployment) {
    // When running from dist/index.js, __dirname is 'dist', so we need 'public' not 'dist/public'
    const distPath = path.join(__dirname, 'public');
    
    // Serve static files with explicit configuration
    app.use(express.static(distPath, {
      maxAge: '1y', // Cache static assets for 1 year
      etag: true,
      lastModified: true,
      index: false, // Don't auto-serve index.html - we'll handle it explicitly
    }));
    
    // SPA fallback - serve index.html for all non-API routes
    // This MUST come after static file serving
    const staticLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.get('*', staticLimiter, (req, res) => {
      // Don't serve index.html for asset requests (they should 404 if missing)
      if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
        return res.status(404).send('Not found');
      }
      
      res.sendFile(path.join(distPath, 'index.html'));
    });
    
    console.info(`Serving static files from: ${distPath}`);
  }

  // A07: Enhanced error handling - Don't leak sensitive information
  // IMPORTANT: Register error handler AFTER all routes

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const error = err as { status?: number; statusCode?: number; message?: string; stack?: string };
    const status = error.status || error.statusCode || 500;

    // A09: Security Logging - Log errors for monitoring
    console.error('[ERROR]', {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    // A07: Don't expose internal error details in production
    const message = status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : error.message || 'Internal Server Error';

    res.status(status).json({ error: message });
  });

  // Start the server
  const server = createServer(app);
  
  // Setup Vite in development mode
  if (isDevelopment) {
    const { setupVite } = await import('./server/vite');
    await setupVite(app, server);
  }
  
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Start the server and keep it running
  server.listen(port, '0.0.0.0', () => {
    console.info(`Server running on port ${port} (${process.env.NODE_ENV || 'production'} mode)`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.info('SIGTERM received, closing server gracefully...');
    server.close(() => {
      console.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.info('SIGINT received, closing server gracefully...');
    server.close(() => {
      console.info('Server closed');
      process.exit(0);
    });
  });
})();

export default app;
