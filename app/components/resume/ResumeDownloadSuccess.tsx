import React from 'react';
import { motion } from 'framer-motion';
import { Download, ThumbsUp, ArrowRight, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResumeDownloadSuccessProps {
  downloadUrl: string;
}

const ResumeDownloadSuccess: React.FC<ResumeDownloadSuccessProps> = ({ downloadUrl }) => {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          duration: 0.6 
        }}
        className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <ThumbsUp className="h-10 w-10 text-green-600 dark:text-green-400" />
      </motion.div>
      
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent"
      >
        Your Request Was Approved!
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-gray-600 dark:text-gray-400 mb-8"
      >
        Thank you for your interest. You can now download my resume using the button below.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-8"
      >
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Resume
          </Button>
        </a>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="space-y-4 border-t border-gray-200 dark:border-gray-800 pt-6"
      >
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">What's Next?</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left"
          >
            <a href="#contact" className="group flex items-start">
              <div className="mr-3 mt-1">
                <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div>
                <h4 className="font-medium text-blue-600 dark:text-blue-400">Get in Touch</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Schedule a call to discuss potential opportunities</p>
              </div>
            </a>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-left"
          >
            <button className="group flex items-start w-full" onClick={() => {
              navigator.clipboard.writeText(window.location.origin);
              alert('Portfolio URL copied to clipboard!');
            }}>
              <div className="mr-3 mt-1">
                <Share2 className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-purple-600 dark:text-purple-400">Share My Portfolio</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Copy my portfolio URL to share with your network</p>
              </div>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResumeDownloadSuccess;