'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useToast } from './use-toast';

export function useNextAuth() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;

  const login = async (username: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: 'Login failed',
          description: 'Invalid username or password',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Success',
        description: 'You have been logged in',
      });
      return true;
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'An error occurred during login',
        variant: 'destructive',
      });
      return false;
    }
  };

  const loginWithGithub = async () => {
    await signIn('github', { callbackUrl: '/' });
  };

  const logout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    loginWithGithub,
    logout,
  };
}