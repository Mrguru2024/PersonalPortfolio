import express, { type Request, Response, NextFunction } from "express";
import { fileURLToPath } from "url";
import path from "path";
import { spawn } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";
import { registerRoutes } from "./routes";

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logger function
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Start Next.js in a separate process
function startNextJsDev() {
  log("Starting Next.js development server...", "nextjs");
  
  const nextProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
    shell: true
  });

  nextProcess.stdout.on('data', (data: Buffer) => {
    log(`${data.toString().trim()}`, "nextjs");
  });

  nextProcess.stderr.on('data', (data: Buffer) => {
    log(`${data.toString().trim()}`, "nextjs");
  });

  nextProcess.on('close', (code: number) => {
    log(`Next.js process exited with code ${code}`, "nextjs");
  });

  return nextProcess;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create an HTTP server
  const server = await registerRoutes(app);

  // Start Next.js in development mode
  const nextProcess = startNextJsDev();

  // Set up proxy middleware to forward requests to Next.js server
  const proxyOptions = {
    target: 'http://localhost:3000',
    changeOrigin: true,
    ws: true,
    // Don't proxy API requests - those are handled by Express
    filter: (pathname: string) => !pathname.startsWith('/api'),
    onProxyReq: (proxyReq: any, req: any, res: any) => {
      // Add any custom headers if needed
    },
    onError: (err: Error, req: any, res: any) => {
      log(`Proxy error: ${err}`, "proxy");
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Next.js server not ready yet, please try again in a moment.');
    }
  };

  app.use('/', createProxyMiddleware(proxyOptions));

  // Add error handler middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server running at http://0.0.0.0:${port}`);
  });

  // Handle shutdown properly
  process.on('SIGINT', () => {
    log("Shutting down server...");
    
    if (nextProcess) {
      nextProcess.kill();
    }
    
    process.exit();
  });
})();
