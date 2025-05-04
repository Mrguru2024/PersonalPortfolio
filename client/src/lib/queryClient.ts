import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Check if we're in a Vercel static deployment
const isStaticVercelDeployment = () => {
  // Check hostname for static deployment detection
  return window.location.hostname.includes('vercel.app') || 
         window.location.hostname.includes('mrguru.dev');
};

export async function apiRequest<T = any>(
  method: string = "GET",
  path: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API request: ${method} ${path}`, data);
  try {
    // For static Vercel deployment, use localStorage for API data
    if (isStaticVercelDeployment() && method === "GET" && path.startsWith('/api/')) {
      console.log(`Static deployment: Using localStorage for ${path}`);
      
      // Extract endpoint name from path (e.g., '/api/skills' -> 'skills')
      const endpoint = path.split('/').pop() || '';
      const localStorageKey = `api_${endpoint}`;
      
      // Get data from localStorage
      const storedData = localStorage.getItem(localStorageKey);
      
      if (storedData) {
        // Create a mock response with the stored data
        const mockResponse = new Response(storedData, {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
        return mockResponse;
      } else {
        console.error(`Static API error: No data found for ${path}`);
        
        // If localStorage fails, attempt to fetch from static JSON file
        const staticPath = `${path}.json`;
        console.log(`Trying static file: ${staticPath}`);
        
        const res = await fetch(staticPath, {
          method: "GET",
          credentials: "include",
        });
        
        if (!res.ok) {
          console.error(`Static API error (${res.status}):`, res.statusText);
          throw new Error(`No data available for ${path}`);
        }
        
        return res;
      }
    }
    
    // Regular API request for development or non-GET methods
    const res = await fetch(path, {
      method: method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API error (${res.status}):`, errorText);
      throw new Error(errorText || res.statusText);
    }
    
    return res;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey[0] as string;
    
    // For static Vercel deployment, use localStorage for API data
    if (isStaticVercelDeployment() && path.startsWith('/api/')) {
      console.log(`Static deployment query: Using localStorage for ${path}`);
      
      try {
        // Extract endpoint name from path (e.g., '/api/skills' -> 'skills')
        const endpoint = path.split('/').pop() || '';
        const localStorageKey = `api_${endpoint}`;
        
        // Get data from localStorage
        const storedData = localStorage.getItem(localStorageKey);
        
        if (storedData) {
          return JSON.parse(storedData);
        } else {
          console.warn(`No localStorage data for ${path}, trying static JSON file`);
          
          // Fallback to static JSON file
          const staticPath = `${path}.json`;
          const res = await fetch(staticPath, {
            credentials: "include",
          });
          
          if (!res.ok) {
            if (unauthorizedBehavior === "returnNull" && res.status === 401) {
              return null;
            }
            throw new Error(`Static API error: ${res.status} ${res.statusText}`);
          }
          
          return await res.json();
        }
      } catch (error) {
        console.error("Static API query failed:", error);
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw error;
      }
    }
    
    // Regular API request for development
    const res = await fetch(path, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
