"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Quote from "lucide-react/dist/esm/icons/quote";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Testimonial structure
type Testimonial = {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  quote: string;
  category: "client" | "colleague" | "recommendation";
  featured?: boolean;
};

// Sample testimonials - in a real app, these would come from an API
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Product Manager",
    company: "TechVision Corp",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop",
    quote: "Anthony's expertise in React and Node.js transformed our project. His ability to understand requirements and deliver elegant solutions was impressive. Our platform performance improved by 40% after his optimizations.",
    category: "client",
    featured: true
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "CTO",
    company: "StartupLaunch",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop",
    quote: "Working with Anthony was a game-changer for our startup. He built our entire user authentication system and integrated it seamlessly with our existing infrastructure. His code quality and documentation are exceptional.",
    category: "client",
    featured: true
  },
  {
    id: 3,
    name: "Jessica Williams",
    role: "Sr. Developer",
    company: "CodeSync Technologies",
    avatar: "https://images.unsplash.com/photo-1619895862022-09114b41f16f?q=80&w=100&auto=format&fit=crop",
    quote: "Having collaborated with Anthony on multiple projects, I can attest to his technical skills and team player mindset. He consistently delivers high-quality code and always shares knowledge with the team.",
    category: "colleague",
    featured: true
  },
  {
    id: 4,
    name: "David Thompson",
    role: "Engineering Lead",
    company: "InnovateX",
    quote: "I've had the pleasure of working alongside Anthony for 2 years. His problem-solving abilities and dedication to quality make him an asset to any team. He excels at both frontend and backend development.",
    category: "recommendation"
  },
  {
    id: 5,
    name: "Sophia Garcia",
    role: "UI/UX Designer",
    company: "VisualCraft",
    quote: "As a designer, I appreciate developers who can bring my designs to life with precision. Anthony does this flawlessly, often adding thoughtful enhancements that improve user experience.",
    category: "colleague"
  }
];

export default function QuotesSection() {
  const [activeTab, setActiveTab] = useState<string>("featured");
  const [visibleTestimonials, setVisibleTestimonials] = useState<Testimonial[]>([]);
  
  useEffect(() => {
    if (activeTab === "featured") {
      setVisibleTestimonials(testimonials.filter(t => t.featured));
    } else {
      setVisibleTestimonials(testimonials.filter(t => t.category === activeTab));
    }
  }, [activeTab]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <section id="testimonials" className="section bg-background relative overflow-hidden">
      <div className="container-custom">
        {/* Section header */}
        <div className="text-center mb-12">
          <motion.h2 
            className="heading-lg mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Client <span className="gradient-text">Testimonials</span>
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Here's what clients and colleagues have to say about working with me.
            Their feedback highlights my commitment to delivering high-quality work and valuable solutions.
          </motion.p>
        </div>
        
        {/* Testimonial tabs */}
        <Tabs 
          defaultValue="featured" 
          className="w-full"
          onValueChange={setActiveTab}
        >
          <div className="flex justify-center mb-12">
            <TabsList className="bg-background/50 backdrop-blur-sm">
              <TabsTrigger 
                value="featured"
                className="data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                Featured
              </TabsTrigger>
              <TabsTrigger 
                value="client"
                className="data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                Clients
              </TabsTrigger>
              <TabsTrigger 
                value="colleague"
                className="data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                Colleagues
              </TabsTrigger>
              <TabsTrigger 
                value="recommendation"
                className="data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                Recommendations
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Content for all tabs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {visibleTestimonials.map((testimonial) => (
              <motion.div key={testimonial.id} variants={itemVariants}>
                <Card className="bg-card/70 backdrop-blur-sm border-primary/10 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                  <CardContent className="p-6 relative">
                    {/* Quote icon */}
                    <div className="absolute -top-2 -left-2 text-primary/10 group-hover:text-primary/20 transition-colors duration-300">
                      <Quote size={40} />
                    </div>
                    
                    <div className="pt-6 pl-2">
                      <p className="text-foreground/90 italic relative z-10 leading-relaxed">
                        "{testimonial.quote}"
                      </p>
                      
                      <div className="mt-6 flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          {testimonial.avatar ? (
                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {testimonial.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        
                        <div>
                          <h4 className="font-medium text-foreground">{testimonial.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.role}, {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Tabs>
        
        {/* CTA */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-muted-foreground mb-6">Ready to work together and build something amazing?</p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-primary/20 hover:shadow-xl relative overflow-hidden group"
              onClick={() => {
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Get in Touch
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                >
                  <MessageCircle className="h-5 w-5" />
                </motion.div>
              </span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Background elements */}
      <div className="absolute -z-10 top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -z-10 -left-40 bottom-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
    </section>
  );
}