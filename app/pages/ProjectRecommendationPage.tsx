"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import ProjectRecommendationForm from '@/components/recommendations/ProjectRecommendationForm';
import ProjectRecommendationResults from '@/components/recommendations/ProjectRecommendationResults';
import { PageSEO, StructuredData } from '@/components/SEO';

interface RecommendationData {
  recommendations: Array<{
    project: {
      id: string;
      title: string;
      description: string;
      category: string;
      tags: string[];
      demoUrl?: string;
      githubUrl?: string;
      imageUrl?: string;
    };
    score: number;
    reason: string;
  }>;
  explanation: string;
}

const ProjectRecommendationPage: React.FC = () => {
  const [recommendationData, setRecommendationData] = useState<RecommendationData | null>(null);

  const handleRecommendationsReceived = (data: RecommendationData) => {
    setRecommendationData(data);
    
    // Scroll to results after a short delay to allow animation
    setTimeout(() => {
      document.getElementById('recommendation-results')?.scrollIntoView({
        behavior: 'smooth'
      });
    }, 100);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Add SEO for Project Recommendations */}
      <PageSEO 
        title="AI Project Recommendations | Find Your Perfect Project | MrGuru.dev"
        description="Get personalized project recommendations tailored to your interests, skills, and learning goals using our AI-powered recommendation engine."
        canonicalPath="/recommendations"
        keywords={["AI recommendations", "project finder", "personalized projects", "web development", "recommendation engine", "GPT-4o"]}
        ogType="website"
        schemaType="WebPage"
      />
      
      {/* Add FAQ structured data */}
      <StructuredData
        schema={{
          type: 'FAQPage',
          data: {
            questions: [
              {
                question: "How does the project recommendation engine work?",
                answer: "Our AI-powered recommendation engine analyzes your interests, skills, and learning goals to match you with relevant projects. It uses GPT-4o technology to understand your preferences and provide personalized project suggestions with explanations for why each project is recommended."
              },
              {
                question: "What kind of projects can be recommended?",
                answer: "The system can recommend various web development, mobile app, data science, game development, and other software projects based on your specific interests and skill level."
              },
              {
                question: "How accurate are the project recommendations?",
                answer: "The recommendations are highly personalized and based on the information you provide. The more specific you are about your interests and goals, the more accurate the recommendations will be."
              },
              {
                question: "Can I get recommendations for projects outside of web development?",
                answer: "Yes, our system can recommend projects across various domains including web development, mobile apps, data science, machine learning, game development, and more."
              },
              {
                question: "How many projects will be recommended?",
                answer: "Typically, the system recommends 3-5 projects, ranked by how well they match your interests and skill level."
              }
            ]
          }
        }}
      />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-900 to-indigo-800 text-white py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center">
            <div className="w-full lg:w-2/3 pr-0 lg:pr-8 mb-8 lg:mb-0">
              <Link href="/" className="inline-flex items-center mb-6 text-blue-300 hover:text-blue-100 transition-colors">
                <ArrowLeft size={16} className="mr-2" />
                Back to Home
              </Link>
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
                AI-Powered Project Recommendations
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Find the perfect projects that match your interests, skills, and learning goals with our intelligent recommendation engine.
              </p>
              <div className="bg-blue-800/50 p-4 rounded-lg border border-blue-700/50 inline-flex items-start">
                <Lightbulb className="text-yellow-300 mr-3 mt-1 flex-shrink-0" />
                <p className="text-sm text-blue-100">
                  Our AI analyzes your preferences and matches them with available projects, providing personalized recommendations with explanations for why each project might be a good fit for you.
                </p>
              </div>
            </div>
            <div className="w-full lg:w-1/3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20 shadow-lg"
              >
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-1 rounded-lg mb-4">
                  <div className="bg-blue-950 p-3 rounded-md h-28 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs uppercase tracking-wider text-blue-300 mb-1">Powered by</div>
                      <div className="font-bold text-xl text-white">GPT-4o & OpenAI</div>
                    </div>
                  </div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-blue-100">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                    Analyze your interests & skills
                  </li>
                  <li className="flex items-center text-sm text-blue-100">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                    Match with relevant projects
                  </li>
                  <li className="flex items-center text-sm text-blue-100">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                    Explain why each recommendation fits you
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-8">
            Tell Us About Your Interests
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ProjectRecommendationForm onRecommendationsReceived={handleRecommendationsReceived} />
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      {recommendationData && (
        <section id="recommendation-results" className="py-12 px-4 sm:px-6 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-center mb-10">Your Personalized Recommendations</h2>
              <ProjectRecommendationResults 
                recommendations={recommendationData.recommendations} 
                explanation={recommendationData.explanation} 
              />
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProjectRecommendationPage;