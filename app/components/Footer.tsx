import Link from "next/link";
import { Code } from "lucide-react";
import SocialLinks from "./SocialLinks";
import { personalInfo } from "@/lib/data";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white py-12 transition-colors duration-300 safe-area-bottom">
      <div className="container mx-auto px-4 safe-area-insets">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="mb-0 md:mb-0 text-center md:text-left">
            <Link href="/" className="text-2xl font-bold text-white flex items-center justify-center md:justify-start">
              <span className="text-primary"><Code className="inline h-6 w-6" /></span>
              <span className="ml-2">MrGuru.dev</span>
            </Link>
            <p className="text-gray-400 mt-2 text-sm max-w-md mx-auto md:mx-0">
              {personalInfo.title} creating elegant solutions for complex problems.
            </p>
            <p className="text-gray-500 mt-1 text-xs">
              Founder of Ascendra Technologies
            </p>
          </div>
          
          <SocialLinks className="text-lg space-x-6" iconClassName="text-gray-400 hover:text-primary transition touch-target" />
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm text-center md:text-left order-2 md:order-1">&copy; {currentYear} MrGuru.dev. All rights reserved.</p>
          
          <div className="flex flex-wrap gap-2 sm:gap-4 justify-center order-1 md:order-2">
            <Link href="/faq" className="touch-target text-gray-400 hover:text-primary text-sm transition inline-flex items-center justify-center px-3 py-2 rounded">
              FAQ
            </Link>
            <Link href="#" className="touch-target text-gray-400 hover:text-primary text-sm transition inline-flex items-center justify-center px-3 py-2 rounded">
              Privacy Policy
            </Link>
            <Link href="#" className="touch-target text-gray-400 hover:text-primary text-sm transition inline-flex items-center justify-center px-3 py-2 rounded">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
