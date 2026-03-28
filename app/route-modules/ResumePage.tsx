"use client";

import { ResumeForm } from "@/components/ResumeForm";
import ParallaxBackground from "@/components/ParallaxBackground";
import Link from "next/link";

export default function ResumePage() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <ParallaxBackground />
      
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 py-8 sm:py-12 relative z-10 min-w-0 max-w-full">
        <div className="max-w-4xl mx-auto min-w-0">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl fold:text-3xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 mb-3 sm:mb-4 px-1">
              Resume Request
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-1">
              I'm excited that you're interested in my qualifications. Please complete the form below to access my resume.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="bg-gradient-to-br from-primary/10 to-blue-600/10 p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Why request my resume?</h2>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="bg-primary/20 rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Detailed Experience:</strong>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      View my comprehensive work history and accomplishments that may not be featured on my website.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="bg-primary/20 rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Education & Certifications:</strong>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      See my formal education, professional certifications, and continuing education courses.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="bg-primary/20 rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Technical Proficiency:</strong>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Get a detailed breakdown of my technical skills and competencies with various technologies.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="bg-primary/20 rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Project History:</strong>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Review a curated list of projects I've worked on with specific outcomes and metrics.
                    </p>
                  </div>
                </li>
              </ul>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">Note:</strong> I request this information to keep track of where my resume is being sent and to better understand who's interested in my services. Your information will never be shared with third parties.
                </p>
              </div>
            </div>
            
            <ResumeForm />
          </div>
        </div>
      </div>
    </div>
  );
}