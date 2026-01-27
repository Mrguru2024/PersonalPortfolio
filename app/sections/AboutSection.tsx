import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { personalInfo } from "@/lib/data";

const AboutSection = () => {
  return (
    <section id="about" className="py-12 xs:py-16 sm:py-20 md:py-24">
      <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <h2 className="text-2xl fold:text-3xl xs:text-3xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">About Me</h2>
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
            
            <a href="/resume">
              <Button className="inline-flex items-center shadow-md hover:shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
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
            <div className="aspect-square max-w-md mx-auto relative z-10 rounded-xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 mix-blend-overlay z-10"></div>
              <img 
                src={personalInfo.image} 
                alt="Anthony Feaster - MrGuru.dev" 
                className="w-full h-full object-cover relative z-0" 
              />
              <div className="absolute bottom-0 left-0 right-0 text-center bg-gradient-to-t from-black/70 to-transparent py-4 z-20">
                <h3 className="text-white font-bold text-xl">Anthony Feaster</h3>
                <p className="text-white/90 text-sm">@MrGuru</p>
              </div>
            </div>
            <div className="absolute top-6 -right-6 w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-lg -z-10 hidden lg:block"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-br from-secondary to-secondary/70 rounded-lg -z-10 hidden lg:block"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
