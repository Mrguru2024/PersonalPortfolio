import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialLinks from "@/components/SocialLinks";
import { personalInfo } from "@/lib/data";
import { useRef, useState } from "react";

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 50]);
  const [hoverWorkBtn, setHoverWorkBtn] = useState(false);
  const [hoverContactBtn, setHoverContactBtn] = useState(false);
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section ref={sectionRef} id="home" className="py-20 md:py-32 relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Background with subtle animation */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        {/* Animated dots/particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div 
              key={i}
              className="absolute rounded-full bg-primary/20 dark:bg-primary/30"
              style={{
                width: Math.random() * 20 + 5,
                height: Math.random() * 20 + 5,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, Math.random() * 30 - 15, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: Math.random() * 5 + 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
      
      <motion.div 
        className="container mx-auto px-4 relative"
        style={{ opacity, y }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.7, 
              type: "spring",
              stiffness: 100 
            }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Hello, I'm</span>{" "}
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              {personalInfo.name}
            </motion.span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.4,
              type: "spring",
              stiffness: 50
            }}
            className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-10"
          >
            <span className="font-medium">{personalInfo.title}</span> specializing in creating elegant solutions to complex problems.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-5"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoverWorkBtn(true)}
              onHoverEnd={() => setHoverWorkBtn(false)}
            >
              <Button
                size="lg"
                onClick={() => scrollToSection("projects")}
                className="bg-primary hover:bg-blue-600 text-white shadow-md hover:shadow-lg px-6 py-6 text-lg relative"
              >
                View My Work
                <AnimatePresence>
                  {hoverWorkBtn && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute -right-2 -top-2 bg-secondary rounded-full p-1"
                    >
                      <MousePointer className="h-3 w-3 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoverContactBtn(true)}
              onHoverEnd={() => setHoverContactBtn(false)}
            >
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection("contact")}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary shadow-md hover:shadow-lg px-6 py-6 text-lg group"
              >
                Get In Touch
                <motion.div
                  animate={{
                    x: hoverContactBtn ? 5 : 0
                  }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:text-primary transition-colors" />
                </motion.div>
              </Button>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-14"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              className="mb-6 text-gray-500 dark:text-gray-400 text-sm"
            >
              Connect with me
            </motion.div>
            <SocialLinks
              className="flex justify-center space-x-8"
              iconClassName="text-xl text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:scale-125 transition-all"
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
