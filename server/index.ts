import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // In development, provide a basic route for the root path
  // In production, Next.js will handle this
  app.get('/', (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MrGuru.dev API Server</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 { color: #3B82F6; }
            p { margin-bottom: 1em; }
            code {
              background: #f4f4f4;
              padding: 2px 4px;
              border-radius: 4px;
            }
            .endpoints {
              background: #f8f8f8;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #3B82F6;
            }
          </style>
        </head>
        <body>
          <h1>MrGuru.dev API Server</h1>
          <p>This is the API server for MrGuru.dev portfolio website. The frontend is being migrated to Next.js.</p>
          
          <div class="endpoints">
            <h2>Available API Endpoints:</h2>
            <ul>
              <li><code>GET /api/projects</code> - List all projects</li>
              <li><code>GET /api/skills</code> - List all skills</li>
              <li><code>GET /api/blog</code> - List all blog posts</li>
              <li><code>GET /api/blog/:slug</code> - Get blog post by slug</li>
            </ul>
          </div>
          
          <p>For more information, visit <a href="https://mrguru.dev">mrguru.dev</a></p>
        </body>
      </html>
    `);
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
    log(`serving on port ${port}`);
  });
})();
