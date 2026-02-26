import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Mail,
  MapPin,
  Phone,
  CheckCircle,
  Calendar,
  Clock,
  ArrowRight,
  ClipboardCheck,
  Sparkles,
  Lightbulb,
  Github,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoSSR } from "@/components/NoSSR";
import { AIAssistant } from "@/components/assessment/AIAssistant";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { contactInfo, socialLinks } from "@/lib/data";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  projectType: z.string().min(1, "Please select a project type"),
  budget: z.string().min(1, "Please select a budget range"),
  timeframe: z.string().min(1, "Please select a timeframe"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  newsletter: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const ContactSection = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      projectType: "",
      budget: "",
      timeframe: "",
      message: "",
      newsletter: false,
    },
  });

  const TwitterIcon = () => (
    <svg
      className="text-2xl w-6 h-6"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

  const getSocialIcon = useCallback((platform: string) => {
    switch (platform.toLowerCase()) {
      case "github":
        return <Github className="text-2xl w-6 h-6" />;
      case "linkedin":
        return <Linkedin className="text-2xl w-6 h-6" />;
      case "twitter":
        return <TwitterIcon />;
      case "email":
        return <Mail className="text-2xl w-6 h-6" />;
      default:
        return null;
    }
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => {
      return apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Quote Request Received",
        description:
          "Thank you for your interest! I'll review your project details and send you a personalized quote within 24 hours.",
      });
      form.reset();
      setFormSubmitted(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to send quote request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = useCallback(
    (data: FormData) => {
      mutate(data);
    },
    [mutate]
  );

  const handleEnhanceWithAI = useCallback(
    async (field: any) => {
      setIsLoadingAI(true);
      try {
        const response = await fetch("/api/assessment/ai-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "improve-description",
            context: field.value || "",
            currentAnswers: {
              projectType: form.watch("projectType"),
              budget: form.watch("budget"),
              timeframe: form.watch("timeframe"),
            },
          }),
        });
        const data = await response.json();
        if (data.improvedText) {
          field.onChange(data.improvedText);
        }
        if (data.suggestions) {
          setAiSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error("Error fetching AI assistance:", error);
      } finally {
        setIsLoadingAI(false);
      }
    },
    [form]
  );

  return (
    <section
      id="contact"
      className="py-12 xs:py-16 sm:py-20 md:py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950"
    >
      <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge
            variant="outline"
            className="text-primary border-primary mb-3 px-3 py-1"
          >
            WORK WITH ME
          </Badge>
          <h2 className="text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Ready to Start Your Project?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">
            Get a custom quote tailored to your goals. Share your project
            details and I'll respond with a clear plan and next steps.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/assessment"
              className="w-full sm:w-auto block sm:inline-block"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 min-h-[44px]"
              >
                <span className="flex items-center justify-center gap-2">
                  <ClipboardCheck className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap text-center">
                    Start Interactive Assessment
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </span>
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Benefits section above the contact form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-white dark:bg-gray-900 border-none shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Expert Craftsmanship</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Each project is built with clean, well-documented code following
                best practices.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-900 border-none shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">On-Time Delivery</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Clear timelines and reliable delivery schedules you can count
                on.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-900 border-none shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Ongoing Support</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Post-launch support and maintenance to keep your project running
                smoothly.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 min-w-0">
          {formSubmitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center text-center min-w-0"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4">Thank You!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your project inquiry has been received. I'll review the details
                and get back to you within 24 hours with a custom quote.
              </p>
              <Button
                onClick={() => setFormSubmitted(false)}
                variant="outline"
                className="px-6 py-2"
              >
                Send Another Request
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 min-w-0 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-6 min-w-0">
                <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold truncate">
                  Get a Custom Quote
                </h3>
              </div>

              <Form {...form}>
                <NoSSR
                  fallback={
                    <div className="space-y-4 animate-pulse">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  }
                >
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                    suppressHydrationWarning
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your full name"
                                {...field}
                                value={field.value || ""}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-200"
                              />
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
                            <FormLabel>Email*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your email address"
                                type="email"
                                {...field}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your phone number"
                                type="tel"
                                {...field}
                                value={field.value || ""}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-200"
                              />
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
                            <FormLabel>
                              Company/Organization (Optional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your company name"
                                {...field}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-2" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Details
                    </p>

                    <FormField
                      control={form.control}
                      name="projectType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Type*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800">
                                <SelectValue placeholder="Select type of project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="website">
                                Website Development
                              </SelectItem>
                              <SelectItem value="webapp">
                                Web Application
                              </SelectItem>
                              <SelectItem value="ecommerce">
                                E-commerce Site
                              </SelectItem>
                              <SelectItem value="mobile">Mobile App</SelectItem>
                              <SelectItem value="custom">
                                Custom Software
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Range*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800">
                                  <SelectValue placeholder="Select your budget" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1-2k">
                                  $1,000 - $2,000
                                </SelectItem>
                                <SelectItem value="2-5k">
                                  $2,000 - $5,000
                                </SelectItem>
                                <SelectItem value="5-10k">
                                  $5,000 - $10,000
                                </SelectItem>
                                <SelectItem value="10k+">$10,000+</SelectItem>
                                <SelectItem value="flexible">
                                  Flexible/Not Sure
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="timeframe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timeframe*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800">
                                  <SelectValue placeholder="When do you need it?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="asap">
                                  As soon as possible
                                </SelectItem>
                                <SelectItem value="1month">
                                  Within 1 month
                                </SelectItem>
                                <SelectItem value="3months">
                                  1-3 months
                                </SelectItem>
                                <SelectItem value="flexible">
                                  Flexible/No rush
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-2">
                            <FormLabel>Project Description*</FormLabel>
                            <AIAssistant
                              type="generate-ideas"
                              context={field.value || ""}
                              currentAnswers={{
                                projectType: form.watch("projectType"),
                                budget: form.watch("budget"),
                                timeframe: form.watch("timeframe"),
                                message: field.value,
                              }}
                            />
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your project, goals, and any specific requirements..."
                              rows={5}
                              {...field}
                              value={field.value || ""}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-200"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                            Minimum 10 characters. Be as detailed as possible
                            for an accurate personalized quote.
                          </FormDescription>
                          <FormMessage />
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEnhanceWithAI(field)}
                              disabled={isLoadingAI || !field.value}
                              className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 min-h-[44px] touch-target border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:border-primary/40 dark:hover:bg-primary/10 dark:hover:border-primary/60"
                            >
                              <span className="flex items-center justify-center gap-2">
                                <Sparkles className="h-4 w-4 shrink-0" />
                                <span className="whitespace-nowrap">
                                  {isLoadingAI
                                    ? "Enhancing..."
                                    : "Enhance with AI"}
                                </span>
                              </span>
                            </Button>
                          </div>
                          {aiSuggestions.length > 0 && (
                            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-primary" />
                                AI Suggestions:
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {aiSuggestions.map((suggestion, idx) => (
                                  <li key={idx}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newsletter"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-gray-200 dark:border-gray-800">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Subscribe to my newsletter for web development
                              tips and insights
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      disabled={isPending}
                      className="w-full px-4 sm:px-6 py-3 bg-primary text-primary-foreground font-bold text-base sm:text-lg rounded-lg hover:bg-primary/90 transition shadow-md hover:shadow-lg min-h-[44px] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                    >
                      {isPending ? "Sending..." : "Request a Quote"}
                    </Button>

                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                      By submitting this form, you agree to be contacted about
                      your project. Your information will never be shared with
                      third parties.
                    </p>
                  </form>
                </NoSSR>
              </Form>
            </motion.div>
          )}

          {/* Contact Information */}
          <div className="min-w-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 fold:p-5 sm:p-6 md:p-8 mb-4 fold:mb-6 sm:mb-8"
            >
              <h3 className="text-base fold:text-lg sm:text-xl font-bold mb-4 fold:mb-5 sm:mb-6">
                Contact Information
              </h3>

              <div className="space-y-3 fold:space-y-4">
                <div className="flex items-start gap-3 fold:gap-4 min-w-0">
                  <div className="flex-shrink-0 mt-0.5 fold:mt-1 w-5 h-5 fold:w-6 fold:h-6 flex items-center justify-center">
                    <Mail className="text-primary w-4 h-4 fold:w-5 fold:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs fold:text-sm text-gray-700 dark:text-gray-300 font-medium">
                      Email
                    </p>
                    <p className="text-xs fold:text-sm text-gray-600 dark:text-gray-400 break-all">
                      {contactInfo.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 fold:gap-4 min-w-0">
                  <div className="flex-shrink-0 mt-0.5 fold:mt-1 w-5 h-5 fold:w-6 fold:h-6 flex items-center justify-center">
                    <MapPin className="text-primary w-4 h-4 fold:w-5 fold:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs fold:text-sm text-gray-700 dark:text-gray-300 font-medium">
                      Location
                    </p>
                    <p className="text-xs fold:text-sm text-gray-600 dark:text-gray-400 break-words">
                      {contactInfo.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 fold:gap-4 min-w-0">
                  <div className="flex-shrink-0 mt-0.5 fold:mt-1 w-5 h-5 fold:w-6 fold:h-6 flex items-center justify-center">
                    <Phone className="text-primary w-4 h-4 fold:w-5 fold:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs fold:text-sm text-gray-700 dark:text-gray-300 font-medium">
                      Phone
                    </p>
                    <p className="text-xs fold:text-sm text-gray-600 dark:text-gray-400 break-all">
                      {contactInfo.phone}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Social Links - Connect With Me */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 fold:p-5 sm:p-6 md:p-8"
            >
              <h3 className="text-base fold:text-lg sm:text-xl font-bold mb-4 fold:mb-5 sm:mb-6">
                Connect With Me
              </h3>

              <div className="grid grid-cols-1 fold-open:grid-cols-2 gap-3 fold:gap-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 fold:gap-4 min-h-[44px] p-3 fold:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition group min-w-0 touch-manipulation"
                  >
                    <span className="flex-shrink-0 text-gray-600 dark:text-gray-400 group-hover:text-primary">
                      {getSocialIcon(link.platform)}
                    </span>
                    <span className="text-sm fold:text-base text-gray-700 dark:text-gray-300 group-hover:text-primary truncate min-w-0">
                      {link.platform}
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
