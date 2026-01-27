

import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema } from '@shared/schema';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AnimatedButton from '@/components/AnimatedButton';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { SiGithub, SiLinkedin, SiThreads } from 'react-icons/si';

export default function Contact() {
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      subject: '',
      company: '',
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/contact', data);
      if (!res.ok) {
        throw new Error('Failed to send message');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Message Sent!',
        description: 'I\'ll get back to you as soon as possible.',
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: any) => {
    contactMutation.mutate(data);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-background/95 to-background/90">
      <div className="container px-4 mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="mb-16"
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            Let's <span className="text-primary">Connect</span>
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12"
            variants={itemVariants}
          >
            Have a project in mind or want to discuss how I can help your business? I'm just a message away. Let's create something amazing together.
          </motion.p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-2"
            >
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6 md:p-8">
                <h3 className="text-xl font-semibold mb-6">Send Me a Message</h3>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input placeholder="Message subject" {...field} />
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
                              <Input placeholder="Your company" {...field} />
                            </FormControl>
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
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="How can I help you?" 
                              className="min-h-32 resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Please provide details about your project or inquiry.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <AnimatedButton
                        type="submit"
                        variant="gradient"
                        size="lg"
                        disabled={contactMutation.isPending}
                        withGlowEffect
                        withHoverEffect
                        className="w-full md:w-auto"
                      >
                        {contactMutation.isPending ? 'Sending...' : 'Send Message'}
                      </AnimatedButton>
                    </div>
                  </form>
                </Form>
              </div>
            </motion.div>
            
            {/* Contact Info */}
            <motion.div
              variants={itemVariants}
              className="space-y-6"
            >
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-6">Contact Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary mr-4">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a 
                        href="mailto:contact@mrguru.dev" 
                        className="font-medium hover:text-primary transition-colors duration-300"
                      >
                        contact@mrguru.dev
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary mr-4">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a 
                        href="tel:+16782165112" 
                        className="font-medium hover:text-primary transition-colors duration-300"
                      >
                        (678) 216-5112
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary mr-4">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">Atlanta, Georgia, USA</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-4">Connect with me on social media</p>
                  <div className="flex gap-4">
                    <a 
                      href="https://github.com/Mrguru2024" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-muted/30 hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-300"
                    >
                      <SiGithub className="h-5 w-5" />
                    </a>
                    <a 
                      href="https://www.linkedin.com/in/anthony-mrguru-feaster/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-muted/30 hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-300"
                    >
                      <SiLinkedin className="h-5 w-5" />
                    </a>
                    <a 
                      href="https://www.threads.com/@therealmrguru" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-muted/30 hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-300"
                    >
                      <SiThreads className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Business Hours</h3>
                <p className="text-sm text-muted-foreground mb-4">I'm available for consultation during these hours:</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>10:00 AM - 2:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <a 
                    href="https://calendly.com/mrguru" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    Schedule a Call
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}