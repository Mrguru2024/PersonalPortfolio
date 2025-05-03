import { Link } from "wouter";
import { Code } from "lucide-react";
import SocialLinks from "./SocialLinks";
import { personalInfo } from "@/lib/data";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white py-12 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="text-2xl font-bold text-white flex items-center">
              <span className="text-primary"><Code className="inline h-6 w-6" /></span>
              <span className="ml-2">MrGuru.dev</span>
            </Link>
            <p className="text-gray-400 mt-2 text-sm max-w-md">
              {personalInfo.title} creating elegant solutions for complex problems.
            </p>
          </div>
          
          <SocialLinks className="text-lg space-x-6" iconClassName="text-gray-400 hover:text-primary transition" />
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">&copy; {currentYear} MrGuru.dev. All rights reserved.</p>
          
          <div className="mt-4 md:mt-0">
            <Link href="#" className="text-gray-400 hover:text-primary text-sm transition mr-4">
              Privacy Policy
            </Link>
            <Link href="#" className="text-gray-400 hover:text-primary text-sm transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
