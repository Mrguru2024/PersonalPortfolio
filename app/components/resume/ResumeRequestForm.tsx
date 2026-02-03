import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, FileCheck, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Form schema for resume request
const ResumeRequestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
  reason: z.enum(["hiring", "collaboration", "networking", "other"]),
  message: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms to proceed",
  }),
});

type ResumeRequestValues = z.infer<typeof ResumeRequestSchema>;

interface ResumeRequestFormProps {
  onRequestSuccess: (downloadUrl: string) => void;
}

const ResumeRequestForm: React.FC<ResumeRequestFormProps> = ({
  onRequestSuccess,
}) => {
  const { toast } = useToast();

  // Initialize form with default values
  const form = useForm<ResumeRequestValues>({
    resolver: zodResolver(ResumeRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      reason: "hiring",
      message: "",
      consent: false,
    },
  });

  // Mutation for submitting the resume request
  const resumeRequestMutation = useMutation({
    mutationFn: async (data: ResumeRequestValues) => {
      const response = await apiRequest("POST", "/api/resume/request", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.downloadUrl) {
        toast({
          title: "Request Successful",
          description:
            "Your request has been approved. You can now download the resume.",
        });
        onRequestSuccess(data.downloadUrl);
      } else {
        toast({
          title: "Request Submitted",
          description:
            "Your request is being processed. Please check your email for updates.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description:
          error.message ||
          "There was an error processing your request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: ResumeRequestValues) => {
    resumeRequestMutation.mutate(values);
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Resume Access Request
      </h2>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Please fill out this form to request access to my resume. I'll review
        your request and provide you with access shortly.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                    <Input placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Company or Organization" {...field} />
                </FormControl>
                <FormDescription>
                  If you're representing a company or organization
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Request</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="hiring">Hiring/Recruitment</SelectItem>
                    <SelectItem value="collaboration">
                      Project Collaboration
                    </SelectItem>
                    <SelectItem value="networking">
                      Professional Networking
                    </SelectItem>
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
                    placeholder="Tell me a bit more about your request..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Any additional details that would help me understand your
                  request better
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I agree to the storage and processing of my information
                  </FormLabel>
                  <FormDescription>
                    Your information will be used only for the purpose of this
                    resume request and will be handled in accordance with
                    privacy best practices.
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            disabled={resumeRequestMutation.isPending}
          >
            {resumeRequestMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Request...
              </>
            ) : (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ResumeRequestForm;
