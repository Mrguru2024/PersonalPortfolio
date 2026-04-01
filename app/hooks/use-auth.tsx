"use client";

import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import type { TrialClientSummary } from "@shared/userTrial";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { devError } from "@/lib/devConsole";

/** Session user from /api/user, /api/login, /api/register — includes server-computed `isSuperUser` and `trial`. */
export type AuthUser = SelectUser & { isSuperUser?: boolean; trial?: TrialClientSummary };

const AUTH_CACHE_KEY = "auth_user_cache_v2";
const AUTH_CACHE_TTL_MS = 60 * 1000; // 60 seconds – short-lived so first load can show last user while /api/user completes

function getCachedUser(): AuthUser | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return undefined;
    const { user, ts } = JSON.parse(raw) as { user: AuthUser | null; ts: number };
    if (Date.now() - ts > AUTH_CACHE_TTL_MS) return undefined;
    return user;
  } catch {
    return undefined;
  }
}

function setCachedUser(user: AuthUser | null): void {
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
  user: AuthUser | null;
  isLoading: boolean;
  /** True while data is from `placeholderData` (sessionStorage preview). Don’t gate SSR/client hydration on raw `user` alone. */
  isAuthPlaceholder: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<AuthUser, Error, RegisterPayload>;
};

type LoginData = Pick<InsertUser, "username" | "password"> & {
  rememberMe?: boolean;
};

/** Payload for /api/register; backend accepts requestAdmin in addition to InsertUser fields. */
type RegisterPayload = InsertUser & { requestAdmin?: boolean };

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const userQuery = useQuery<AuthUser | null, Error>({
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
          if (res.status !== 401) {
            devError("[auth] /api/user non-OK", res.status);
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

  const user = userQuery.data;
  const error = userQuery.error;
  const isLoading = userQuery.isLoading;
  const isAuthPlaceholder = userQuery.isPlaceholderData;

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
    onSuccess: (user: AuthUser) => {
      setCachedUser(user);
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        descriptionKey: "auth.welcomeBack",
        values: { username: user.username ?? "there" },
      });
      if (user?.isAdmin && !user?.adminApproved) {
        toast({
          title: "Admin access pending",
          description: "Your founder admin request is awaiting approval. You’ll get access once approved.",
          variant: "default",
        });
      }
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
    mutationFn: async (credentials: RegisterPayload) => {
      try {
        const res = await apiRequest("POST", "/api/register", credentials);
        const userData = await res.json();
        return userData;
      } catch (error) {
        devError("[auth] registration request failed");
        throw error;
      }
    },
    onSuccess: (user: AuthUser) => {
      setCachedUser(user);
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        descriptionKey: "auth.welcomeRegister",
        values: { username: user.username ?? "there" },
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
      devError("[auth] registration mutation error");
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
        devError("[auth] logout request failed");
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
        isAuthPlaceholder,
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

export { isAuthSuperUser, isAuthApprovedAdmin } from "@/lib/super-admin";