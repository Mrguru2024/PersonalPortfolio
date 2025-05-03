'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, GitHub, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = loginSchema.extend({
  email: z.string().email('Please enter a valid email'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], 
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Auth() {
  const router = useRouter();
  const { data: session } = useSession();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  
  const { 
    register: registerLogin, 
    handleSubmit: handleLoginSubmit, 
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    }
  });
  
  const { 
    register: registerSignup, 
    handleSubmit: handleSignupSubmit, 
    formState: { errors: signupErrors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });
  
  // Redirect to home if already logged in
  if (session) {
    router.push('/');
    return null;
  }
  
  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: false,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      // Auto-login after registration
      const result = await signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: false,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      router.push('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGithubLogin = async () => {
    try {
      setGithubLoading(true);
      await signIn('github', { callbackUrl: '/' });
    } catch (err) {
      console.error('GitHub login error:', err);
      setError('GitHub login failed');
      setGithubLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Form */}
            <div className="bg-card rounded-xl p-8 shadow-md">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2 text-gradient">
                  {authMode === 'login' ? 'Welcome Back' : 'Join The Community'}
                </h1>
                <p className="text-muted-foreground">
                  {authMode === 'login'
                    ? 'Sign in to access your account'
                    : 'Create an account to join the discussions'}
                </p>
              </div>
              
              {error && (
                <div className="bg-red-500/10 text-red-500 p-4 rounded-lg mb-6">
                  {error}
                </div>
              )}
              
              <div className="mb-8">
                <button
                  onClick={handleGithubLogin}
                  disabled={githubLoading}
                  className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  {githubLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <GitHub className="mr-2 h-5 w-5" />
                  )}
                  Continue with GitHub
                </button>
                
                <div className="flex items-center my-6">
                  <div className="flex-1 border-t border-border" />
                  <span className="px-4 text-sm text-muted-foreground">or</span>
                  <div className="flex-1 border-t border-border" />
                </div>
              </div>
              
              {/* Login Form */}
              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="login-username" className="block text-sm font-medium mb-1">
                      Username
                    </label>
                    <input
                      id="login-username"
                      type="text"
                      {...registerLogin('username')}
                      className="w-full p-3 rounded-lg border border-border bg-background"
                    />
                    {loginErrors.username && (
                      <p className="mt-1 text-sm text-red-500">{loginErrors.username.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="login-password" className="block text-sm font-medium mb-1">
                      Password
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      {...registerLogin('password')}
                      className="w-full p-3 rounded-lg border border-border bg-background"
                    />
                    {loginErrors.password && (
                      <p className="mt-1 text-sm text-red-500">{loginErrors.password.message}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="button-gradient w-full py-3 rounded-lg text-white font-medium mt-2 disabled:opacity-70 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignupSubmit(onRegisterSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="register-username" className="block text-sm font-medium mb-1">
                      Username
                    </label>
                    <input
                      id="register-username"
                      type="text"
                      {...registerSignup('username')}
                      className="w-full p-3 rounded-lg border border-border bg-background"
                    />
                    {signupErrors.username && (
                      <p className="mt-1 text-sm text-red-500">{signupErrors.username.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="register-email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      id="register-email"
                      type="email"
                      {...registerSignup('email')}
                      className="w-full p-3 rounded-lg border border-border bg-background"
                    />
                    {signupErrors.email && (
                      <p className="mt-1 text-sm text-red-500">{signupErrors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="register-password" className="block text-sm font-medium mb-1">
                      Password
                    </label>
                    <input
                      id="register-password"
                      type="password"
                      {...registerSignup('password')}
                      className="w-full p-3 rounded-lg border border-border bg-background"
                    />
                    {signupErrors.password && (
                      <p className="mt-1 text-sm text-red-500">{signupErrors.password.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="register-confirm-password" className="block text-sm font-medium mb-1">
                      Confirm Password
                    </label>
                    <input
                      id="register-confirm-password"
                      type="password"
                      {...registerSignup('confirmPassword')}
                      className="w-full p-3 rounded-lg border border-border bg-background"
                    />
                    {signupErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">{signupErrors.confirmPassword.message}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="button-gradient w-full py-3 rounded-lg text-white font-medium mt-2 disabled:opacity-70 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Create Account
                  </button>
                </form>
              )}
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setError(null);
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                  }}
                  className="text-primary hover:underline text-sm"
                >
                  {authMode === 'login'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
            
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-primary/10 to-background p-8 rounded-xl hidden md:block">
              <h2 className="text-3xl font-bold mb-6">Unlock the Full Experience</h2>
              <p className="text-muted-foreground mb-8">
                Join MrGuru's developer community to access exclusive features and engage with content.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-primary/20 p-2 rounded-full mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                      <path d="M10 2c1 .5 2 2 2 5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Comment on Blog Posts</h3>
                    <p className="text-muted-foreground text-sm">
                      Engage with articles and share your thoughts with the community.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/20 p-2 rounded-full mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <path d="M8 13h2" />
                      <path d="M8 17h2" />
                      <path d="M14 13h2" />
                      <path d="M14 17h2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Contribute Content</h3>
                    <p className="text-muted-foreground text-sm">
                      Submit your own articles and insights for review and publication.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/20 p-2 rounded-full mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Save Favorites</h3>
                    <p className="text-muted-foreground text-sm">
                      Bookmark your favorite projects and articles for quick access.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <a
                  href="https://github.com/Mrguru2024"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  <span>Visit My GitHub</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}