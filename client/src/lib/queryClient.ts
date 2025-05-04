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
      
      try {
        // Extract endpoint name from path (e.g., '/api/skills' -> 'skills')
        const endpoint = path.split('/').pop() || '';
        const localStorageKey = `api_${endpoint}`;
        
        // Get data from localStorage
        const storedData = localStorage.getItem(localStorageKey);
        
        if (storedData) {
          // Parse and validate data
          let parsedData = JSON.parse(storedData);
          
          // Fix missing properties in blog posts
          if (endpoint === 'blog' && Array.isArray(parsedData)) {
            parsedData = parsedData.map((post) => ({
              ...post,
              tags: post.tags || [],
              content: post.content || '',
              coverImage: post.coverImage || '',
              publishedAt: post.publishedAt || new Date().toISOString()
            }));
          }
          
          // Fix missing properties in skills data
          else if (endpoint === 'skills') {
            // Case 1: Skills already in categorized format
            if (typeof parsedData === 'object' && !Array.isArray(parsedData)) {
              const skillsObj = parsedData as Record<string, any>;
              
              // Ensure each category exists and is an array
              parsedData = {
                frontend: Array.isArray(skillsObj.frontend) 
                  ? skillsObj.frontend.map((skill: any) => ({
                      ...skill,
                      id: skill.id || 0,
                      name: skill.name || 'Unknown Skill',
                      category: 'frontend',
                      percentage: skill.percentage || 50,
                      endorsement_count: skill.endorsement_count || 0
                    }))
                  : [],
                backend: Array.isArray(skillsObj.backend)
                  ? skillsObj.backend.map((skill: any) => ({
                      ...skill,
                      id: skill.id || 0,
                      name: skill.name || 'Unknown Skill',
                      category: 'backend',
                      percentage: skill.percentage || 50,
                      endorsement_count: skill.endorsement_count || 0
                    }))
                  : [],
                devops: Array.isArray(skillsObj.devops)
                  ? skillsObj.devops.map((skill: any) => ({
                      ...skill,
                      id: skill.id || 0,
                      name: skill.name || 'Unknown Skill',
                      category: 'devops',
                      percentage: skill.percentage || 50,
                      endorsement_count: skill.endorsement_count || 0
                    }))
                  : []
              };
            }
            // Case 2: Skills in flat array format
            else if (Array.isArray(parsedData)) {
              parsedData = parsedData.map((skill) => ({
                ...skill,
                id: skill.id || 0,
                name: skill.name || 'Unknown Skill',
                category: skill.category || 'frontend',
                percentage: skill.percentage || 50,
                endorsement_count: skill.endorsement_count || 0
              }));
            }
            // Case 3: Invalid format - create empty structure
            else {
              parsedData = {
                frontend: [],
                backend: [],
                devops: []
              };
            }
          }
          
          // Create a mock response with the cleaned data
          const mockResponse = new Response(JSON.stringify(parsedData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
          return mockResponse;
        } else {
          console.warn(`Static API error: No data found for ${path}`);
          
          // Provide default empty data structure
          let defaultData;
          if (endpoint === 'blog') {
            defaultData = [];
          } else if (endpoint === 'skills') {
            defaultData = { frontend: [], backend: [], devops: [] };
          } else {
            defaultData = {};
          }
          
          return new Response(JSON.stringify(defaultData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error(`Static API error processing data:`, error);
        
        // Return empty data on error
        return new Response('[]', {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
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
          let parsedData = JSON.parse(storedData);
          
          // Fix missing properties in blog posts
          if (endpoint === 'blog' && Array.isArray(parsedData)) {
            parsedData = parsedData.map((post) => ({
              ...post,
              tags: post.tags || [],
              content: post.content || '',
              coverImage: post.coverImage || '',
              publishedAt: post.publishedAt || new Date().toISOString()
            }));
          }
          // Fix missing properties in skills data
          else if (endpoint === 'skills') {
            // Case 1: Skills already in categorized format
            if (typeof parsedData === 'object' && !Array.isArray(parsedData)) {
              const skillsObj = parsedData as Record<string, any>;
              
              // Ensure each category exists and is an array
              parsedData = {
                frontend: Array.isArray(skillsObj.frontend) 
                  ? skillsObj.frontend.map((skill: any) => ({
                      ...skill,
                      id: skill.id || 0,
                      name: skill.name || 'Unknown Skill',
                      category: 'frontend',
                      percentage: skill.percentage || 50,
                      endorsement_count: skill.endorsement_count || 0
                    }))
                  : [],
                backend: Array.isArray(skillsObj.backend)
                  ? skillsObj.backend.map((skill: any) => ({
                      ...skill,
                      id: skill.id || 0,
                      name: skill.name || 'Unknown Skill',
                      category: 'backend',
                      percentage: skill.percentage || 50,
                      endorsement_count: skill.endorsement_count || 0
                    }))
                  : [],
                devops: Array.isArray(skillsObj.devops)
                  ? skillsObj.devops.map((skill: any) => ({
                      ...skill,
                      id: skill.id || 0,
                      name: skill.name || 'Unknown Skill',
                      category: 'devops',
                      percentage: skill.percentage || 50,
                      endorsement_count: skill.endorsement_count || 0
                    }))
                  : []
              };
            }
            // Case 2: Skills in flat array format
            else if (Array.isArray(parsedData)) {
              parsedData = parsedData.map((skill) => ({
                ...skill,
                id: skill.id || 0,
                name: skill.name || 'Unknown Skill',
                category: skill.category || 'frontend',
                percentage: skill.percentage || 50,
                endorsement_count: skill.endorsement_count || 0
              }));
            }
            // Case 3: Invalid format - create empty structure
            else {
              parsedData = {
                frontend: [],
                backend: [],
                devops: []
              };
            }
          }
          
          return parsedData;
        } else {
          console.warn(`No localStorage data for ${path}, trying static JSON file`);
          
          try {
            // Fallback to static JSON file
            const staticPath = `${path}.json`;
            const res = await fetch(staticPath, {
              credentials: "include",
            });
            
            if (!res.ok) {
              if (unauthorizedBehavior === "returnNull" && res.status === 401) {
                return null;
              }
              
              // Return safe default data structures
              if (endpoint === 'blog') {
                return [];
              } else if (endpoint === 'skills') {
                return { frontend: [], backend: [], devops: [] };
              } else {
                return {};
              }
            }
            
            const data = await res.json();
            
            // Fix missing properties in returned data
            if (endpoint === 'blog' && Array.isArray(data)) {
              return data.map((post) => ({
                ...post,
                tags: post.tags || [],
                content: post.content || '',
                coverImage: post.coverImage || '',
                publishedAt: post.publishedAt || new Date().toISOString()
              }));
            }
            // Fix missing properties in skills data
            else if (endpoint === 'skills') {
              // Case 1: Skills already in categorized format
              if (typeof data === 'object' && !Array.isArray(data)) {
                const skillsObj = data as Record<string, any>;
                
                // Ensure each category exists and is an array
                return {
                  frontend: Array.isArray(skillsObj.frontend) 
                    ? skillsObj.frontend.map((skill: any) => ({
                        ...skill,
                        id: skill.id || 0,
                        name: skill.name || 'Unknown Skill',
                        category: 'frontend',
                        percentage: skill.percentage || 50,
                        endorsement_count: skill.endorsement_count || 0
                      }))
                    : [],
                  backend: Array.isArray(skillsObj.backend)
                    ? skillsObj.backend.map((skill: any) => ({
                        ...skill,
                        id: skill.id || 0,
                        name: skill.name || 'Unknown Skill',
                        category: 'backend',
                        percentage: skill.percentage || 50,
                        endorsement_count: skill.endorsement_count || 0
                      }))
                    : [],
                  devops: Array.isArray(skillsObj.devops)
                    ? skillsObj.devops.map((skill: any) => ({
                        ...skill,
                        id: skill.id || 0,
                        name: skill.name || 'Unknown Skill',
                        category: 'devops',
                        percentage: skill.percentage || 50,
                        endorsement_count: skill.endorsement_count || 0
                      }))
                    : []
                };
              }
              // Case 2: Skills in flat array format
              else if (Array.isArray(data)) {
                return data.map((skill) => ({
                  ...skill,
                  id: skill.id || 0,
                  name: skill.name || 'Unknown Skill',
                  category: skill.category || 'frontend',
                  percentage: skill.percentage || 50,
                  endorsement_count: skill.endorsement_count || 0
                }));
              }
            }
            
            return data;
          } catch (fetchError) {
            console.error("Static file fetch error:", fetchError);
            // Return safe default data structures
            if (endpoint === 'blog') {
              return [];
            } else if (endpoint === 'skills') {
              return { frontend: [], backend: [], devops: [] };
            } else {
              return {};
            }
          }
        }
      } catch (error) {
        console.error("Static API query failed:", error);
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        
        // Return safe default data structures on error
        const endpoint = path.split('/').pop() || '';
        if (endpoint === 'blog') {
          return [];
        } else if (endpoint === 'skills') {
          return { frontend: [], backend: [], devops: [] };
        } else {
          return {};
        }
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
