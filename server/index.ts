import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Start Vite dev server in a separate process
function startViteDevServer() {
  log("Starting Vite development server...", "vite");
  
  const viteProcess = spawn('npx', ['vite', '--port', '3000'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
    shell: true
  });

  viteProcess.stdout?.on('data', (data) => {
    log(`${data.toString().trim()}`, "vite");
  });

  viteProcess.stderr?.on('data', (data) => {
    log(`Error: ${data.toString().trim()}`, "vite");
  });

  viteProcess.on('close', (code) => {
    log(`Vite process exited with code ${code}`, "vite");
  });

  return viteProcess;
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
  // Start the Vite dev server for the React client
  const viteProcess = startViteDevServer();

  const server = await registerRoutes(app);

  // Add error handler middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Set up a proxy for the Vite dev server
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API requests - those are handled by Express
    if (url.startsWith('/api')) {
      return next();
    }
    
    try {
      // Proxy the request to the Vite dev server
      const proxyReq = await fetch(`http://localhost:3000${url}`, {
        method: req.method,
        headers: req.headers as any,
        redirect: 'manual',
        // Pass request body if the request has one
        ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: req.body } : {})
      });
      
      // Copy response headers from Vite
      for (const [key, value] of proxyReq.headers.entries()) {
        if (key !== 'content-encoding') { // Skip content-encoding as it might cause issues
          res.setHeader(key, value);
        }
      }
      
      // Set the status code
      res.status(proxyReq.status);
      
      // Send the response body
      const body = await proxyReq.arrayBuffer();
      res.send(Buffer.from(body));
    } catch (error) {
      log(`Error proxying to Vite server: ${error}`, "proxy");
      // Serve a nice error page if Vite server isn't ready yet
      res.writeHead(500, {
        'Content-Type': 'text/html',
      });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>MrGuru.dev - Frontend Loading</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 40px auto;
                padding: 20px;
                text-align: center;
              }
              h1 { color: #3B82F6; }
              p { margin-bottom: 1em; }
              .loader {
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3B82F6;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1.5s linear infinite;
                margin: 20px auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
            <script>
              setTimeout(() => {
                window.location.reload();
              }, 5000);
            </script>
          </head>
          <body>
            <h1>MrGuru.dev</h1>
            <p>The frontend is starting up. This page will automatically refresh.</p>
            <div class="loader"></div>
            <p>If this page doesn't load within a minute, please check the server logs.</p>
            
            <div>
              <h2>Available API Endpoints:</h2>
              <ul style="list-style: none; padding: 0;">
                <li><code>GET /api/projects</code> - List all projects</li>
                <li><code>GET /api/skills</code> - List all skills</li>
                <li><code>GET /api/blog</code> - List all blog posts</li>
                <li><code>GET /api/blog/:slug</code> - Get blog post by slug</li>
              </ul>
            </div>
          </body>
        </html>
      `);
    }
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
    log(`API server serving on port ${port}`);
    log(`Proxying frontend requests to Vite dev server on port 3000`);
  });

  // Handle shutdown properly
  process.on('SIGINT', () => {
    log("Shutting down servers...");
    if (viteProcess) {
      viteProcess.kill();
    }
    process.exit();
  });
})();
