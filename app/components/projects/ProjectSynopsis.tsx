import React from "react";
import { Project } from "@/lib/data";
import { CheckCircle, ArrowRight, Palette, Layout, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProjectSynopsisProps {
  project: Project;
}

export function ProjectSynopsis({ project }: ProjectSynopsisProps) {
  if (!project.synopsis) return null;

  const { tagline, description, caseStudy } = project.synopsis;
  const ux = project.uxUiBreakdown;

  return (
    <div className="my-10">
      <h2 className="text-2xl font-bold mb-2 flex items-center">
        <span className="mr-2">🔍</span> {project.title}
      </h2>
      <p className="text-xl font-medium text-indigo-600 dark:text-indigo-400 mb-5">
        {tagline}
      </p>
      <h3 className="text-xl font-bold mb-3 flex items-center">
        <span className="mr-2">🧠</span> Project Synopsis
      </h3>
      <p className="text-lg leading-relaxed mb-8 text-gray-700 dark:text-gray-300">
        {description}
      </p>

      <h3 className="text-xl font-bold mb-5 flex items-center">
        <span className="mr-2">💡</span> Case Study Breakdown
      </h3>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card className="border-2 border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Problem</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300">
            {caseStudy.problem}
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">My Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {caseStudy.role.map((role, index) => (
                <li 
                  key={index} 
                  className="flex items-start text-gray-700 dark:text-gray-300"
                >
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{role}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mb-10">
        <h4 className="text-lg font-semibold mb-3">Tech Stack</h4>
        <div className="flex flex-wrap gap-2 mb-6">
          {caseStudy.stack.map((tech, index) => (
            <Badge key={index} variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full">
              {tech}
            </Badge>
          ))}
        </div>

        <h4 className="text-lg font-semibold mb-3">Key Features</h4>
        <ul className="space-y-2 mb-6">
          {caseStudy.features.map((feature, index) => (
            <li 
              key={index} 
              className="flex items-start text-gray-700 dark:text-gray-300"
            >
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <h4 className="text-lg font-semibold mb-3">Current Status</h4>
        <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400 mb-6">
          {caseStudy.status}
        </p>

        <h4 className="text-lg font-semibold mb-3">Looking Ahead</h4>
        <ul className="space-y-2">
          {caseStudy.nextSteps.map((step, index) => (
            <li 
              key={index} 
              className="flex items-start text-gray-700 dark:text-gray-300"
            >
              <ArrowRight className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {ux && (
        <>
          <Separator className="my-8" />
          <h3 className="text-xl font-bold mb-5 flex items-center">
            <span className="mr-2"><Palette className="h-5 w-5 text-primary" /></span>
            UX/UI Breakdown
          </h3>
          <p className="text-lg leading-relaxed mb-6 text-gray-700 dark:text-gray-300">
            <Target className="h-5 w-5 inline-block mr-2 text-primary align-middle" />
            <strong className="text-foreground">Purpose of the site:</strong> {ux.purposeOfSite}
          </p>

          <h4 className="text-lg font-semibold mb-3 flex items-center">
            <Layout className="h-5 w-5 mr-2 text-primary" />
            Design factors
          </h4>
          <div className="grid md:grid-cols-1 gap-4 mb-8">
            {ux.designFactors.map((factor, index) => (
              <Card key={index} className="border border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{factor.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-700 dark:text-gray-300 text-sm">
                  {factor.description}
                </CardContent>
              </Card>
            ))}
          </div>

          <h4 className="text-lg font-semibold mb-3">Key components & purpose</h4>
          <ul className="space-y-3 mb-6">
            {ux.components.map((comp, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">{comp.name}</strong> — {comp.purpose}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <Separator className="my-8" />
    </div>
  );
}