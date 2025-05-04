'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { resumeRequestFormSchema } from '../../shared/schema';
import { z } from 'zod';
import { Loader2, Download, Lock, Mail, CheckCircle } from 'lucide-react';

type FormValues = z.infer<typeof resumeRequestFormSchema>;

export default function Resume() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(resumeRequestFormSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      purpose: ''
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch('/api/resume-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request resume');
      }
      
      const result = await response.json();
      setDownloadToken(result.token);
      setIsSuccess(true);
      reset();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadToken) return;
    
    try {
      // Redirect to download endpoint with token
      window.location.href = `/api/resume?token=${downloadToken}`;
    } catch (err) {
      console.error('Error downloading resume:', err);
      setError('Failed to download resume. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-gradient">My Resume</h1>
          <p className="text-lg text-muted-foreground mb-12">
            I'd love to share my resume with you. To receive it, please fill out the form below so I can better understand your needs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-card rounded-xl p-8 shadow-md order-2 md:order-1">
              {isSuccess ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">Thank You!</h3>
                  <p className="text-muted-foreground mb-6">
                    Your request has been received. Click the button below to download my resume.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="button-gradient inline-flex items-center px-6 py-3 rounded-lg text-white font-medium"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Resume
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {error && (
                    <div className="bg-red-500/10 text-red-500 p-4 rounded-lg mb-4">
                      {error}
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Full Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      {...register('name')}
                      className="w-full p-3 rounded-lg border border-border bg-background"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="w-full p-3 rounded-lg border border-border bg-background"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium mb-1">
                      Company/Organization
                    </label>
                    <input
                      id="company"
                      type="text"
                      {...register('company')}
                      className="w-full p-3 rounded-lg border border-border bg-background"
                    />
                    {errors.company && (
                      <p className="mt-1 text-sm text-red-500">{errors.company.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="purpose" className="block text-sm font-medium mb-1">
                      Purpose for Requesting Resume *
                    </label>
                    <select
                      id="purpose"
                      {...register('purpose')}
                      className="w-full p-3 rounded-lg border border-border bg-background"
                    >
                      <option value="">Select a purpose</option>
                      <option value="job_opportunity">Job Opportunity</option>
                      <option value="freelance_work">Freelance Work</option>
                      <option value="networking">Professional Networking</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.purpose && (
                      <p className="mt-1 text-sm text-red-500">{errors.purpose.message}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="button-gradient w-full px-6 py-3 rounded-lg text-white font-medium disabled:opacity-70 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Request Resume
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Your information will only be used to understand who's interested in my work.
                  </p>
                </form>
              )}
            </div>
            
            <div className="order-1 md:order-2">
              <div className="bg-gradient-to-br from-primary/10 to-background p-8 rounded-xl mb-8">
                <h2 className="text-2xl font-semibold mb-4">Why Request My Resume?</h2>
                <p className="text-muted-foreground mb-6">
                  My resume provides a comprehensive overview of my skills, experience, and achievements as a Full-Stack Developer specializing in JavaScript and modern web technologies.
                </p>
                <ul className="space-y-4">
                  <li className="flex">
                    <div className="mr-3 text-primary">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-medium">Detailed work history</span> with notable projects and accomplishments
                    </div>
                  </li>
                  <li className="flex">
                    <div className="mr-3 text-primary">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-medium">Technical skills breakdown</span> showing proficiency levels
                    </div>
                  </li>
                  <li className="flex">
                    <div className="mr-3 text-primary">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-medium">Education and certifications</span> that validate my expertise
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="bg-card rounded-xl p-8 shadow-md">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Lock className="mr-2 h-5 w-5 text-primary" />
                  Privacy Guarantee
                </h2>
                <p className="text-muted-foreground text-sm">
                  I respect your privacy. Your information will never be shared with third parties and will only be used to understand who's interested in my services and respond appropriately.
                </p>
                
                <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center">
                  <Mail className="mr-2 h-5 w-5 text-primary" />
                  Direct Contact
                </h2>
                <p className="text-muted-foreground text-sm">
                  Prefer to reach out directly? Feel free to email me at <a href="mailto:anthony@mrguru.dev" className="text-primary hover:underline">anthony@mrguru.dev</a> or call <a href="tel:+16785061143" className="text-primary hover:underline">(678) 506-1143</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}