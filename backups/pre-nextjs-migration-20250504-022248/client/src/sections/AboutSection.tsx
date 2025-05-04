import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { personalInfo } from "@/lib/data";

const AboutSection = () => {
  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <h2 className="text-3xl font-bold mb-6">About Me</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              I'm a passionate full-stack developer with 5+ years of experience creating web and mobile applications. 
              My journey in technology began with a Computer Science degree, followed by work at innovative startups and established tech companies.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              I specialize in building robust, user-friendly applications using modern technologies. 
              My approach combines technical excellence with an eye for design and a focus on delivering exceptional user experiences.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Education</h3>
                <ul className="text-gray-600 dark:text-gray-400 space-y-2">
                  {personalInfo.education.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Experience</h3>
                <ul className="text-gray-600 dark:text-gray-400 space-y-2">
                  {personalInfo.experience.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <a 
              href={personalInfo.resumeUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button className="inline-flex items-center shadow-md hover:shadow-lg">
                <FileText className="mr-2 h-4 w-4" />
                Download Resume
              </Button>
            </a>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2 relative"
          >
            <div className="aspect-square max-w-md mx-auto relative z-10 rounded-xl overflow-hidden shadow-xl">
              <img 
                src={personalInfo.image} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="absolute top-6 -right-6 w-24 h-24 bg-primary rounded-lg -z-10 hidden lg:block"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-secondary rounded-lg -z-10 hidden lg:block"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
