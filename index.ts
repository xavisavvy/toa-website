import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./server/routes";
import { configureSecurity } from "./server/security";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// A05: Security Misconfiguration - Apply security middleware FIRST
configureSecurity(app);

// Body parsing middleware (with size limits)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Register API routes
(async () => {
  await registerRoutes(app);

  // A07: Enhanced error handling - Don't leak sensitive information
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // A09: Security Logging - Log errors for monitoring
    console.error('[ERROR]', {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    // A07: Don't expose internal error details in production
    const message = status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

    res.status(status).json({ error: message });
  });

  // Serve static files from dist/public in production (Vercel)
  // Note: Vercel will automatically serve files from public/ directory via CDN
  if (process.env.VERCEL) {
    // On Vercel, serve the built client from dist
    const distPath = path.join(__dirname, 'dist', 'public');
    app.use(express.static(distPath));
    
    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
})();

// Export for Vercel (Vercel will handle the server startup)
export default app;

// Local development server (only runs when not on Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  const { setupVite } = await import('./server/vite');
  const { createServer } = await import('http');
  
  const server = createServer(app);
  await setupVite(app, server);
  
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, '0.0.0.0', () => {
    console.log(`Development server running on port ${port}`);
  });
}
