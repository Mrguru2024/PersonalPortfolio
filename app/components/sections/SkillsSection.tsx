"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Temporarily hardcoded skills data (will connect to API later)
const skills = {
  frontend: [
    { name: "React / Next.js", level: 95 },
    { name: "TypeScript", level: 90 },
    { name: "TailwindCSS", level: 95 },
    { name: "Framer Motion", level: 85 },
    { name: "HTML5 / CSS3", level: 95 },
    { name: "JavaScript", level: 95 },
    { name: "Redux / Context API", level: 90 },
    { name: "Responsive Design", level: 95 },
  ],
  backend: [
    { name: "Node.js", level: 90 },
    { name: "Express", level: 90 },
    { name: "Next.js API Routes", level: 85 },
    { name: "PostgreSQL", level: 85 },
    { name: "MongoDB", level: 80 },
    { name: "RESTful APIs", level: 90 },
    { name: "GraphQL", level: 75 },
    { name: "Authentication", level: 90 },
  ],
  other: [
    { name: "Git / GitHub", level: 90 },
    { name: "Docker", level: 75 },
    { name: "CI/CD", level: 80 },
    { name: "Testing (Jest, RTL)", level: 85 },
    { name: "AWS Basics", level: 75 },
    { name: "Agile / Scrum", level: 90 },
    { name: "UI/UX Principles", level: 85 },
    { name: "Performance Optimization", level: 85 },
  ],
};

export default function SkillsSection() {
  const [activeCategory, setActiveCategory] = useState<string>("frontend");
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };
  
  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section id="skills" className="section bg-card relative overflow-hidden">
      <div className="container-custom">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.h2 
            className="heading-lg mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            My <span className="gradient-text">Skills</span>
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            I've worked with a variety of technologies across the full stack.
            Here's a breakdown of my technical expertise.
          </motion.p>
        </div>
        
        {/* Skills tabs */}
        <Tabs 
          defaultValue="frontend" 
          className="w-full"
          onValueChange={setActiveCategory}
        >
          <div className="flex justify-center mb-8">
            <TabsList className="bg-background/50 backdrop-blur-sm">
              <TabsTrigger 
                value="frontend"
                className="data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                Frontend
              </TabsTrigger>
              <TabsTrigger 
                value="backend"
                className="data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                Backend
              </TabsTrigger>
              <TabsTrigger 
                value="other"
                className="data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                DevOps & Tools
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Frontend skills */}
          <TabsContent value="frontend">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate={activeCategory === "frontend" ? "visible" : "hidden"}
            >
              {skills.frontend.map((skill, index) => (
                <motion.div 
                  key={skill.name}
                  className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border border-border"
                  variants={itemVariants}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">{skill.name}</h3>
                    <span className="text-sm text-muted-foreground">{skill.level}%</span>
                  </div>
                  <Progress 
                    value={skill.level} 
                    className="h-2 bg-muted"
                  />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
          
          {/* Backend skills */}
          <TabsContent value="backend">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate={activeCategory === "backend" ? "visible" : "hidden"}
            >
              {skills.backend.map((skill, index) => (
                <motion.div 
                  key={skill.name}
                  className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border border-border"
                  variants={itemVariants}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">{skill.name}</h3>
                    <span className="text-sm text-muted-foreground">{skill.level}%</span>
                  </div>
                  <Progress 
                    value={skill.level} 
                    className="h-2 bg-muted"
                  />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
          
          {/* Other skills */}
          <TabsContent value="other">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate={activeCategory === "other" ? "visible" : "hidden"}
            >
              {skills.other.map((skill, index) => (
                <motion.div 
                  key={skill.name}
                  className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border border-border"
                  variants={itemVariants}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">{skill.name}</h3>
                    <span className="text-sm text-muted-foreground">{skill.level}%</span>
                  </div>
                  <Progress 
                    value={skill.level} 
                    className="h-2 bg-muted"
                  />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
        
        {/* Additional skills / interests */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="heading-sm mb-6">Additional Skills & Interests</h3>
          
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Web Accessibility", "PWA Development", "Serverless", 
              "WebSockets", "SEO", "Web Performance", "Micro Frontends",
              "JAMstack", "Headless CMS", "Data Visualization"
            ].map((skill) => (
              <span 
                key={skill}
                className="px-4 py-2 bg-accent/20 text-accent-foreground rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute -z-10 -right-40 -top-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    </section>
  );
}