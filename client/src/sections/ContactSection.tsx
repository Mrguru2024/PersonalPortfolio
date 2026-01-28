import { useState } from "react";
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
} from "lucide-react";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "github":
        return <FaGithub className="text-2xl" />;
      case "linkedin":
        return <FaLinkedin className="text-2xl" />;
      case "twitter":
        return <FaTwitter className="text-2xl" />;
      case "email":
        return <Mail className="text-2xl" />;
      default:
        return null;
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => {
      return apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Thank you for your message. I'll get back to you soon!",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    setFormSubmitted(true);

    // For demonstration, we'll just show a toast
    toast({
      title: "Quote Request Sent",
      description:
        "Thank you for your interest! I'll review your project details and get back to you within 24 hours.",
    });

    // In a real application, we would send the data to the server
    // mutate(data);
  };

  return (
    <section
      id="contact"
      className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950"
    >
      <div className="container mx-auto px-4">
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
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Let's Build Something Amazing Together
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Ready to take your online presence to the next level? Get a custom
            quote for your project and let's create a solution that drives
            results.
          </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {formSubmitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Thank You!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your project inquiry has been received. I'll review the details
                and get back to you within 24 hours with a custom quote.
              </p>
              <Button
                onClick={() => setFormSubmitted(false)}
                variant="outline"
                size="lg"
                className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base w-full sm:w-auto min-h-[44px]"
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
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8"
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Get a Custom Quote</h3>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
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
                          <FormLabel>Company/Organization (Optional)</FormLabel>
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
                        <FormLabel>Project Description*</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your project, goals, and any specific requirements..."
                            rows={5}
                            {...field}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-200"
                          />
                        </FormControl>
                        <FormMessage />
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
                            Subscribe to my newsletter for web development tips
                            and insights
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isPending}
                    className="w-full px-4 sm:px-6 py-3 bg-primary text-white font-bold text-base sm:text-lg rounded-lg hover:bg-primary/90 transition shadow-md hover:shadow-lg min-h-[44px]"
                  >
                    {isPending ? "Sending..." : "Request a Quote"}
                  </Button>

                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                    By submitting this form, you agree to be contacted about
                    your project. Your information will never be shared with
                    third parties.
                  </p>
                </form>
              </Form>
            </motion.div>
          )}

          {/* Contact Information */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 mb-8"
            >
              <h3 className="text-xl font-bold mb-6">Contact Information</h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Mail className="text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      Email
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {contactInfo.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <MapPin className="text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      Location
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {contactInfo.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Phone className="text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      Phone
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {contactInfo.phone}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8"
            >
              <h3 className="text-xl font-bold mb-6">Connect With Me</h3>

              <div className="grid grid-cols-2 gap-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition group"
                  >
                    <span className="text-gray-600 dark:text-gray-400 group-hover:text-primary">
                      {getSocialIcon(link.platform)}
                    </span>
                    <span className="ml-4 text-gray-700 dark:text-gray-300 group-hover:text-primary">
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
