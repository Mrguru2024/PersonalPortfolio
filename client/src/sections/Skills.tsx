

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Skill } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Skills() {
  const { data: skills, isLoading } = useQuery<Skill[]>({
    queryKey: ['/api/skills'],
  });

  const categorizedSkills = {
    frontend: skills?.filter(skill => skill.category === 'frontend') || [],
    backend: skills?.filter(skill => skill.category === 'backend') || [],
    database: skills?.filter(skill => skill.category === 'database') || [],
    devops: skills?.filter(skill => skill.category === 'devops') || [],
    design: skills?.filter(skill => skill.category === 'design') || [],
    other: skills?.filter(skill => !['frontend', 'backend', 'database', 'devops', 'design'].includes(skill.category)) || [],
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

  // Categories with their titles and accent colors
  const categories = [
    { key: 'frontend', title: 'Frontend Development', color: 'from-blue-500 to-cyan-400' },
    { key: 'backend', title: 'Backend Development', color: 'from-violet-500 to-purple-400' },
    { key: 'database', title: 'Database Management', color: 'from-amber-500 to-yellow-400' },
    { key: 'devops', title: 'DevOps & Deployment', color: 'from-emerald-500 to-green-400' },
    { key: 'design', title: 'UI/UX Design', color: 'from-rose-500 to-pink-400' },
    { key: 'other', title: 'Other Skills', color: 'from-indigo-500 to-blue-400' },
  ];

  return (
    <section id="skills" className="py-20 bg-gradient-to-b from-background/90 to-background/95">
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
            My <span className="text-primary">Technical</span> Skills
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12"
            variants={itemVariants}
          >
            I've spent years developing a diverse set of skills that allow me to handle every aspect of web development, from frontend design to backend architecture.
          </motion.p>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {categories.map(category => {
                const categorySkills = categorizedSkills[category.key as keyof typeof categorizedSkills];
                if (categorySkills.length === 0) return null;
                
                return (
                  <motion.div
                    key={category.key}
                    variants={itemVariants}
                    className="relative"
                  >
                    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                      <div className={`h-1 w-full bg-gradient-to-r ${category.color}`} />
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-6">{category.title}</h3>
                        <div className="space-y-4">
                          {categorySkills.map(skill => (
                            <div key={skill.id} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{skill.name}</span>
                                <span className="text-sm text-muted-foreground">{skill.percentage}%</span>
                              </div>
                              <Progress 
                                value={skill.percentage} 
                                className="h-2 bg-muted/50" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}