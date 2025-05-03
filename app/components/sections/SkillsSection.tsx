'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchFromAPI } from '@/app/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skill } from '@/shared/schema';

type GroupedSkills = Record<string, Skill[]>;

export default function SkillsSection() {
  const [groupedSkills, setGroupedSkills] = useState<GroupedSkills>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");
  
  useEffect(() => {
    const loadSkills = async () => {
      try {
        setLoading(true);
        const data = await fetchFromAPI<GroupedSkills>('/api/skills');
        setGroupedSkills(data);
        
        const categories = Object.keys(data);
        setCategories(categories);
        
        if (categories.length > 0) {
          setActiveCategory(categories[0]);
        }
      } catch (error) {
        console.error('Failed to load skills:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSkills();
  }, []);
  
  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };
  
  const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 bg-gradient-to-b from-background to-card/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInVariants}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            My <span className="text-gradient">Skills</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-blue-500 mx-auto mb-6" />
          <p className="text-muted-foreground max-w-2xl mx-auto">
            I've acquired a diverse range of skills throughout my career. Here's a comprehensive 
            overview of my technical expertise and proficiency in various technologies.
          </p>
        </motion.div>
        
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="flex flex-wrap justify-center mb-8 h-auto bg-transparent">
              {categories.map(category => (
                <TabsTrigger 
                  key={category}
                  value={category}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground mb-2 mx-1"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map(category => (
              <TabsContent key={category} value={category}>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate={activeCategory === category ? "visible" : "hidden"}
                >
                  {groupedSkills[category]?.map(skill => (
                    <motion.div 
                      key={skill.id}
                      className="bg-card rounded-lg p-6 shadow-md"
                      variants={fadeInVariants}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{skill.name}</h4>
                        <span className="text-sm text-muted-foreground">
                          {skill.percentage}%
                        </span>
                      </div>
                      <Progress value={skill.percentage} className="h-2" />
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </section>
  );
}