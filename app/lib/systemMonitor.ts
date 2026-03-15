/**
 * In-memory system monitor for errors and optional activity.
 * Used by super admin to diagnose issues. Per-instance (serverless may have empty buffer on cold start).
 */

const MAX_ENTRIES = 500;

export interface LogEntry {
  id: string;
  type: "error" | "activity";
  message: string;
  stack?: string;
  route?: string;
  url?: string;
  method?: string;
  status?: number;
  userId?: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

const buffer: LogEntry[] = [];
let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `log-${Date.now()}-${idCounter}`;
}

function push(entry: Omit<LogEntry, "id" | "timestamp">): void {
  const full: LogEntry = {
    ...entry,
    id: nextId(),
    timestamp: Date.now(),
  };
  buffer.push(full);
  if (buffer.length > MAX_ENTRIES) buffer.shift();
}

/**
 * Capture an error (message, stack, route, etc.) for the system dashboard.
 */
export function captureError(
  err: unknown,
  context?: { route?: string; url?: string; method?: string; userId?: string; [k: string]: unknown }
): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  push({
    type: "error",
    message,
    stack,
    route: context?.route,
    url: context?.url,
    method: context?.method,
    userId: context?.userId as string | undefined,
    context: context ? { ...context, route: undefined, url: undefined, method: undefined, userId: undefined } : undefined,
  });
}

/**
 * Optionally record API activity (path, method, status, user) for auditing.
 */
export function captureActivity(activity: {
  route?: string;
  url?: string;
  method?: string;
  status?: number;
  userId?: string;
  message?: string;
  [k: string]: unknown;
}): void {
  push({
    type: "activity",
    message: activity.message ?? `${activity.method ?? "?"} ${activity.route ?? activity.url ?? "?"} ${activity.status ?? ""}`.trim(),
    route: activity.route,
    url: activity.url,
    method: activity.method,
    status: activity.status,
    userId: activity.userId,
    context: activity,
  });
}

/**
 * Get recent log entries (newest first).
 */
export function getLogs(limit = 200): LogEntry[] {
  return [...buffer].reverse().slice(0, limit);
}

/**
 * Clear all stored logs.
 */
export function clearLogs(): void {
  buffer.length = 0;
}

/**
 * Get log entry counts for health/overview (total and errors).
 */
export function getLogStats(): { total: number; errors: number } {
  const total = buffer.length;
  const errors = buffer.filter((e) => e.type === "error").length;
  return { total, errors };
}

/**
 * Capture an error from an API route with request context (route, method).
 * Use in catch blocks: captureApiError(error, req);
 */
export function captureApiError(
  err: unknown,
  req?: { nextUrl?: { pathname?: string }; method?: string }
): void {
  const route = req?.nextUrl?.pathname;
  const method = req?.method;
  captureError(err, { route, method });
}

/**
 * Parse stack trace to extract file:line for "fix needed" display.
 */
export function parseStackForFix(stack: string | undefined): { file?: string; line?: number; column?: number; snippet?: string }[] {
  if (!stack) return [];
  const lines = stack.split("\n");
  const results: { file?: string; column?: number; line?: number; snippet?: string }[] = [];
  // Match at path:line:column or path(line:column)
  const re = /(?:\s+at\s+.*?\s+\()?(?:file:\/\/)?([^\s)]+):(\d+):(\d+)\)?|\(([^)]+):(\d+):(\d+)\)/g;
  for (const line of lines) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(line)) !== null) {
      const file = m[1] ?? m[4];
      const lineNum = parseInt(m[2] ?? m[5], 10);
      const col = parseInt(m[3] ?? m[6], 10);
      if (file && !file.includes("node_modules")) {
        results.push({
          file: file.replace(/^.*[\\/]/, ""),
          line: lineNum,
          column: col,
          snippet: line.trim(),
        });
      }
    }
  }
  return results.slice(0, 5);
}
