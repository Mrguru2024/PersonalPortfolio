import { motion } from "framer-motion";
import { Code, Server, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SkillsGroup from "@/components/skills/SkillsGroup";
import { 
  frontendSkills, 
  backendSkills, 
  devopsSkills, 
  additionalSkills 
} from "@/lib/data";

const SkillsSection = () => {
  return (
    <section id="skills" className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">Skills & Expertise</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            My technical skillset and areas of expertise that I've developed over the years.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <SkillsGroup
              title="Frontend Development"
              skills={frontendSkills}
              icon={<Code className="text-primary text-xl" />}
              barColor="bg-primary"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <SkillsGroup
              title="Backend Development"
              skills={backendSkills}
              icon={<Server className="text-secondary text-xl" />}
              barColor="bg-secondary"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <SkillsGroup
              title="Tools & Frameworks"
              skills={devopsSkills}
              icon={<Wrench className="text-purple-600 dark:text-purple-400 text-xl" />}
              barColor="bg-purple-600 dark:bg-purple-500"
            />
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <h3 className="text-xl font-bold mb-6 text-center">Additional Skills</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {additionalSkills.map((skill, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-white dark:bg-gray-900 px-4 py-2 text-gray-700 dark:text-gray-300 text-sm font-medium shadow"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SkillsSection;
