"use client";

import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { funnelThankYouUrl, THANK_YOU_SESSION } from '@/lib/funnelThankYou';
import { devError } from '@/lib/devConsole';
import { Loader2 } from 'lucide-react';

// Resume request form schema
const resumeRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required"),
  message: z.string().optional(),
});

type ResumeRequestFormValues = z.infer<typeof resumeRequestSchema>;

export function ResumeForm() {
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<ResumeRequestFormValues>({
    resolver: zodResolver(resumeRequestSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      purpose: '',
      message: '',
    },
  });

  const resumeRequestMutation = useMutation({
    mutationFn: async (values: ResumeRequestFormValues) => {
      const res = await apiRequest('POST', '/api/resume/request', values);
      return await res.json();
    },
    onSuccess: async (data) => {
      try {
        const resumeRes = await fetch(`/api/resume/download/${data.accessToken}`);
        const resumeData = await resumeRes.json();
        const url = resumeData.resumeUrl as string | undefined;
        if (url && typeof window !== "undefined") {
          sessionStorage.setItem(THANK_YOU_SESSION.resumeDownloadUrl, url);
        }
        toast({
          title: "Request received",
          description: url ? "Opening your confirmation page." : "We’ll follow up shortly.",
          variant: "default",
        });
        router.push(funnelThankYouUrl("resume_request"));
      } catch {
        devError("[ResumeForm] resume fetch after submit failed");
        toast({
          title: "Error",
          description: "Could not retrieve the resume. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message || "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: ResumeRequestFormValues) {
    resumeRequestMutation.mutate(values);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-md w-full mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Request Resume</h3>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Please fill out this form to access my resume.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Company Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purpose</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="job_opportunity">Job Opportunity</SelectItem>
                    <SelectItem value="freelance_project">Freelance Project</SelectItem>
                    <SelectItem value="networking">Professional Networking</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Information (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Please share any additional details about your request..."
                    className="resize-none min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white"
            disabled={resumeRequestMutation.isPending}
          >
            {resumeRequestMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Request Resume
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}