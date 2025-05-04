'use client';

// This is a wrapper to transition from the old auth system to NextAuth
// While keeping backward compatibility with existing components

import { createContext, ReactNode, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNextAuth } from './use-next-auth';
import { User } from '@shared/schema';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: {
    isPending: boolean;
    mutate: (credentials: { username: string; password: string }) => Promise<void>;
    error: Error | null;
  };
  logoutMutation: {
    isPending: boolean;
    mutate: () => Promise<void>;
    error: Error | null;
  };
  registerMutation: {
    isPending: boolean;
    mutate: (data: any) => Promise<void>;
    error: Error | null;
  };
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { 
    user, 
    isLoading, 
    login,
    logout
  } = useNextAuth();

  // Create compatibility layer with old auth system
  const loginMutation = {
    isPending: false,
    error: null as Error | null,
    mutate: async (credentials: { username: string; password: string }) => {
      try {
        await login(credentials.username, credentials.password);
      } catch (error) {
        toast({
          title: 'Login failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    }
  };

  const logoutMutation = {
    isPending: false,
    error: null as Error | null,
    mutate: async () => {
      try {
        await logout();
      } catch (error) {
        toast({
          title: 'Logout failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    }
  };
  
  const registerMutation = {
    isPending: false,
    error: null as Error | null,
    mutate: async (data: any) => {
      toast({
        title: 'Registration',
        description: 'Please use the registration form on the auth page',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user as User | null,
        isLoading,
        error: null,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}