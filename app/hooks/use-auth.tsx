import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const AUTH_CACHE_KEY = "auth_user_cache";
const AUTH_CACHE_TTL_MS = 60 * 1000; // 60 seconds – short-lived so first load can show last user while /api/user completes

function getCachedUser(): SelectUser | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return undefined;
    const { user, ts } = JSON.parse(raw) as { user: SelectUser | null; ts: number };
    if (Date.now() - ts > AUTH_CACHE_TTL_MS) return undefined;
    return user;
  } catch {
    return undefined;
  }
}

function setCachedUser(user: SelectUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user === null) {
      sessionStorage.removeItem(AUTH_CACHE_KEY);
    } else {
      sessionStorage.setItem(
        AUTH_CACHE_KEY,
        JSON.stringify({ user, ts: Date.now() })
      );
    }
  } catch {
    // ignore
  }
}

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password"> & {
  rememberMe?: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user", {
          credentials: "include",
        });

        if (res.status === 401) {
          setCachedUser(null);
          return null;
        }

        if (!res.ok) {
          const errorText = await res.text().catch(() => res.statusText);
          if (res.status !== 401) {
            console.error(`Error fetching user data: ${res.status} ${errorText}`);
          }
          return null;
        }

        const userData = await res.json();
        setCachedUser(userData);
        return userData;
      } catch (err) {
        return null;
      }
    },
    placeholderData: () => getCachedUser() ?? undefined,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: false,
    throwOnError: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        // Only send username and password to API, rememberMe is handled separately
        const { rememberMe, ...loginCredentials } = credentials;
        const res = await apiRequest("POST", "/api/login", {
          ...loginCredentials,
          rememberMe, // Include rememberMe for cookie expiration
        });
        const userData = await res.json();
        return userData;
      } catch (error) {
        // Don't log login errors - they're expected for wrong credentials
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      setCachedUser(user);
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
      // Handle redirect if present in URL
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get("redirect");
        if (redirect) {
          window.location.href = redirect;
        }
      }
    },
    onError: (error: Error) => {
      // Don't log login errors to console - they're expected for wrong credentials
      // Only show user-friendly toast notification
      const errorMessage = error.message || "Please check your credentials and try again";
      let displayMessage = errorMessage;
      
      // Parse JSON error messages if present
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.message) {
          displayMessage = parsed.message;
        }
      } catch {
        // Not JSON, use as-is
      }
      
      toast({
        title: "Login failed",
        description: displayMessage,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      try {
        const res = await apiRequest("POST", "/api/register", credentials);
        const userData = await res.json();
        return userData;
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      setCachedUser(user);
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.username}!`,
      });
      // Handle redirect if present in URL
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get("redirect");
        if (redirect) {
          window.location.href = redirect;
        }
      }
    },
    onError: (error: Error) => {
      console.error("Registration mutation error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Please try a different username",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/logout");
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setCachedUser(null);
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}