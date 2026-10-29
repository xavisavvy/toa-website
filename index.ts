import 'dotenv/config';
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import rateLimit from "express-rate-limit";

import { configureApp, registerErrorHandler } from "./server/app";
import { validateEnvironment } from "./server/env-validator";
import { registerRoutes } from "./server/routes";

// Validate environment variables before starting
validateEnvironment();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Security headers, CORS, webhook raw bodies, sessions, body parsing, CSRF and
// request logging - shared with the dev entry so the two can't drift
configureApp(app);

// Health check endpoint for Autoscale Deployments (on /health to not interfere with homepage)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Tales of Aneria',
    timestamp: new Date().toISOString()
  });
});

// Express 4 does not catch rejected promises from async handlers, and Node
// exits on an unhandled rejection by default. Log it instead so one bad
// request can't take the whole site down.
process.on('unhandledRejection', (reason) => {
  const error = reason as { message?: string; stack?: string } | undefined;
  console.error('[UNHANDLED REJECTION]', {
    timestamp: new Date().toISOString(),
    message: error?.message ?? String(reason),
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
  });
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

  // IMPORTANT: Register error handler AFTER all routes
  registerErrorHandler(app);

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
