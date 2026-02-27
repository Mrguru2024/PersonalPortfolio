import { motion } from "framer-motion";
import { CheckCircle, Brain, Laptop, Database, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SkillsGroup from "@/components/skills/SkillsGroup";
import {
  additionalSkills,
  frontendSkills as staticFrontend,
  backendSkills as staticBackend,
  devopsSkills as staticDevops,
} from "@/lib/data";
import { useRef, useState, useEffect } from "react";
import { Skill } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

function getStaticSkillsData() {
  const toSkill = (
    s: { name: string; percentage: number },
    cat: string,
    i: number
  ): Skill => ({
    id: i,
    name: s.name,
    percentage: s.percentage,
    category: cat,
    endorsement_count: 0,
  });
  let id = 0;
  return {
    frontend: staticFrontend.map((s) => toSkill(s, "frontend", ++id)),
    backend: staticBackend.map((s) => toSkill(s, "backend", ++id)),
    devops: staticDevops.map((s) => toSkill(s, "devops", ++id)),
  };
}

const SkillsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [skillsData, setSkillsData] = useState<{
    frontend: Skill[];
    backend: Skill[];
    devops: Skill[];
  }>({
    frontend: [],
    backend: [],
    devops: [],
  });

  // Fetch skills from API with client-side fallback
  const {
    data: skills,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/skills"],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);
        const res = await fetch("/api/skills", {
          credentials: "include",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) return getStaticSkillsData();
        const json = await res.json();
        if (typeof json === "object" && !Array.isArray(json)) {
          return {
            frontend: Array.isArray(json.frontend) ? json.frontend : [],
            backend: Array.isArray(json.backend) ? json.backend : [],
            devops: Array.isArray(json.devops) ? json.devops : [],
          };
        }
        return getStaticSkillsData();
      } catch {
        return getStaticSkillsData();
      }
    },
    staleTime: 60_000,
  });

  // Process skills data when it's loaded
  useEffect(() => {
    if (!skills) {
      // Default empty data
      setSkillsData({
        frontend: [],
        backend: [],
        devops: [],
      });
      return;
    }

    try {
      // Case 1: If skills is an object with frontend, backend, and devops properties
      if (typeof skills === "object" && !Array.isArray(skills)) {
        const skillsObj = skills as Record<string, any>;

        // Make sure all categories are arrays, even if missing
        setSkillsData({
          frontend: Array.isArray(skillsObj.frontend) ? skillsObj.frontend : [],
          backend: Array.isArray(skillsObj.backend) ? skillsObj.backend : [],
          devops: Array.isArray(skillsObj.devops) ? skillsObj.devops : [],
        });
      }
      // Case 2: If skills is an array, filter by category
      else if (Array.isArray(skills)) {
        // Ensure each skill has all required properties
        const validatedSkills = skills.map((skill) => ({
          ...skill,
          id: skill.id || 0,
          name: skill.name || "Unknown Skill",
          category: skill.category || "frontend",
          percentage: skill.percentage || 50,
          endorsement_count: skill.endorsement_count || 0,
        }));

        const frontendSkills = validatedSkills.filter(
          (skill) => skill.category === "frontend"
        );
        const backendSkills = validatedSkills.filter(
          (skill) => skill.category === "backend"
        );
        const devopsSkills = validatedSkills.filter(
          (skill) => skill.category === "devops"
        );

        setSkillsData({
          frontend: frontendSkills,
          backend: backendSkills,
          devops: devopsSkills,
        });
      }
      // Case 3: Unexpected data format
      else {
        console.warn("Unexpected skills data format:", skills);
        // Fall back to empty data
        setSkillsData({
          frontend: [],
          backend: [],
          devops: [],
        });
      }

      console.log("Skills data processed:", skills);
    } catch (error) {
      console.error("Error processing skills data:", error);
      // Fall back to empty data
      setSkillsData({
        frontend: [],
        backend: [],
        devops: [],
      });
    }
  }, [skills]);

  // Animation variants for the additional skills
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { scale: 0.8, opacity: 0 },
    show: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
    hover: {
      scale: 1.1,
      y: -5,
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
    tap: {
      scale: 0.95,
    },
  };

  if (isLoading) {
    return (
      <section
        id="skills"
        className="py-12 xs:py-16 sm:py-20 flex items-center justify-center"
      >
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading skills data from GitHub...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        id="skills"
        className="py-12 xs:py-16 sm:py-20 flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load skills data</p>
          <p className="text-muted-foreground text-sm max-w-md">
            {(error as Error).message}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="py-12 xs:py-16 sm:py-20 md:py-24 relative overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
    >
      {/* Decorative elements */}
      <motion.div
        className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white to-transparent dark:from-gray-900 dark:to-transparent opacity-70"
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white to-transparent dark:from-gray-900 dark:to-transparent opacity-70"
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary/5 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 2,
        }}
      />

      <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 50 }}
          viewport={{ once: true, amount: 0.1 }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-block mb-3"
          >
            <Badge
              variant="outline"
              className="px-3 py-1 bg-white/50 dark:bg-black/30 backdrop-blur-sm text-primary dark:text-primary border-primary/20"
            >
              PROFESSIONAL EXPERTISE
            </Badge>
          </motion.div>

          <motion.h2
            className="text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Skills & Technical Proficiency
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed"
          >
            My core technical competencies and areas of expertise that I've
            mastered throughout my professional journey.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0.9, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, type: "spring" }}
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{ y: -10 }}
            className="group"
          >
            <SkillsGroup
              title="Frontend Development"
              skills={skillsData.frontend}
              icon={
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Laptop className="text-primary text-xl" />
                </motion.div>
              }
              barColor="bg-gradient-to-r from-primary to-blue-400"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, type: "spring" }}
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{ y: -10 }}
            className="group"
          >
            <SkillsGroup
              title="Backend Development"
              skills={skillsData.backend}
              icon={
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Database className="text-secondary text-xl" />
                </motion.div>
              }
              barColor="bg-gradient-to-r from-secondary to-green-400"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, type: "spring" }}
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{ y: -10 }}
            className="group"
          >
            <SkillsGroup
              title="Tools & DevOps"
              skills={skillsData.devops}
              icon={
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Wrench className="text-purple-600 dark:text-purple-400 text-xl" />
                </motion.div>
              }
              barColor="bg-gradient-to-r from-purple-600 to-pink-500"
            />
          </motion.div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-16 p-8 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl shadow-lg"
        >
          <motion.h3
            className="text-xl font-bold mb-8 text-center relative"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <span className="bg-gradient-to-r from-primary/20 to-secondary/20 bg-[length:100%_10px] bg-no-repeat bg-bottom pb-2">
              Additional Skills & Competencies
            </span>
          </motion.h3>

          <div className="flex flex-wrap justify-center gap-3">
            {additionalSkills.map((skill, index) => (
              <motion.div
                key={index}
                variants={item}
                whileHover="hover"
                whileTap="tap"
                custom={index}
              >
                <Badge
                  variant="outline"
                  className="bg-white dark:bg-gray-800 px-4 py-2 text-gray-700 dark:text-gray-300 text-sm font-medium shadow-sm hover:shadow-md transition-all border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary flex items-center gap-1.5"
                >
                  <CheckCircle className="h-3 w-3 text-primary/70" />
                  {skill}
                </Badge>
              </motion.div>
            ))}
          </div>

          {/* Skills summary message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto italic">
              My diverse skill set allows me to tackle projects from concept to
              deployment, ensuring elegant solutions to complex technical
              challenges.
            </p>
          </motion.div>
        </motion.div>

        {/* Brain icon as a fun animated element */}
        <motion.div
          className="absolute right-10 -bottom-10 opacity-10 dark:opacity-5"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Brain className="w-40 h-40" />
        </motion.div>
      </div>
    </section>
  );
};

export default SkillsSection;
