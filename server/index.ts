import 'dotenv/config';
import express from "express";

import { configureApp, registerErrorHandler } from "./app";
import { validateEnvironment } from "./env-validator";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Validate environment variables before starting
validateEnvironment();

const app = express();

// Security headers, CORS, webhook raw bodies, sessions, body parsing, CSRF and
// request logging - shared with the production entry (root index.ts)
configureApp(app, { log });

(async () => {
  const server = await registerRoutes(app);

  registerErrorHandler(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // Windows does not support reusePort and rejects 0.0.0.0 binds with ENOTSUP
  // in some Node 22 builds. Default to localhost on win32 so local dev / Playwright works.
  const isWindows = process.platform === 'win32';
  const host = process.env.HOST ?? (isWindows ? 'localhost' : '0.0.0.0');
  const listenOpts: { port: number; host: string; reusePort?: boolean } = { port, host };
  if (!isWindows) {
    listenOpts.reusePort = true;
  }
  server.listen(listenOpts, () => {
    log(`serving on ${host}:${port}`);
  });
})();
