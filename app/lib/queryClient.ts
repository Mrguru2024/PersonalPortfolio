import { QueryClient } from "@tanstack/react-query";

export async function apiRequest<T = unknown>(
  method: string,
  path: string,
  data?: unknown
): Promise<Response> {
  const res = await fetch(path, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text) as { message?: string; error?: string };
      const msg = json.message || json.error;
      if (typeof msg === "string" && msg.trim().length > 0) {
        throw new Error(msg.trim());
      }
    } catch (e) {
      if (e instanceof Error && e.message.trim().length > 0 && e.name === "Error") {
        throw e;
      }
    }
    throw new Error(text || res.statusText);
  }
  return res;
}

function defaultQueryFn({ queryKey }: { queryKey: readonly unknown[] }) {
  const key = queryKey[0];
  if (typeof key !== "string" || !key.startsWith("/")) {
    throw new Error("Query key must be a path string (e.g. '/api/projects')");
  }
  return fetch(key, { credentials: "include" }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    return res.json();
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      queryFn: defaultQueryFn,
    },
    mutations: {
      retry: false,
    },
  },
});
