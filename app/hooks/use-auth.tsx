import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
        
        // 401 is expected when not authenticated - return null silently
        // Don't log or throw - this is normal behavior
        if (res.status === 401) {
          return null;
        }
        
        // Handle other error statuses
        if (!res.ok) {
          const errorText = await res.text().catch(() => res.statusText);
          // Only log non-401 errors
          if (res.status !== 401) {
            console.error(`Error fetching user data: ${res.status} ${errorText}`);
          }
          return null;
        }
        
        const userData = await res.json();
        return userData;
      } catch (err) {
        // Network errors - fail silently
        return null;
      }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: false,
    // Don't treat 401 as an error - it's expected when not authenticated
    throwOnError: false,
    // Use stale time to avoid unnecessary refetches
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Error handling is done in the queryFn - 401s are handled silently
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
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
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
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.username}!`,
      });
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