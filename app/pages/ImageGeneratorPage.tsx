"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import ImageGenerator from '@/components/ImageGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Wand2 } from 'lucide-react';
import { PageSEO } from '@/components/SEO';

export default function ImageGeneratorPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { user, loginMutation } = useAuth();

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const renderExamples = () => {
    const examples = [
      {
        title: "Project Backgrounds",
        description: "Generate professional project backgrounds",
        prompts: [
          "A minimalist tech workspace with soft lighting for a portfolio project",
          "Abstract digital pattern with blue and purple gradients for a web app background",
          "Elegant code visualization with glowing lines on dark background"
        ]
      },
      {
        title: "Blog Post Images",
        description: "Create compelling blog post header images",
        prompts: [
          "A developer's journey symbolized by a winding road with code signposts",
          "Coffee cup next to laptop with code reflection in a modern workspace",
          "Futuristic UI design concept with holographic elements"
        ]
      },
      {
        title: "Skill Illustrations",
        description: "Visualize your technical skills",
        prompts: [
          "JavaScript and React logos merged in a creative 3D design",
          "Database structure visualization with glowing connections",
          "DevOps pipeline visualization with containers and cloud elements"
        ]
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {examples.map((category, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle>{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">Example prompts:</p>
              <ul className="text-sm list-disc pl-5 space-y-1">
                {category.prompts.map((prompt, promptIdx) => (
                  <li key={promptIdx} className="cursor-pointer hover:text-primary transition-colors">
                    {prompt}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Add SEO for Image Generator Page */}
      <PageSEO 
        title="AI Image Generator | Create Custom Images | MrGuru.dev"
        description="Generate custom images for your projects, blogs, and portfolio using OpenAI's DALL-E 3 model. Create professional visuals with simple text prompts."
        canonicalPath="/generate-images"
        keywords={["AI image generator", "DALL-E 3", "custom images", "OpenAI", "blog images", "project visuals", "portfolio graphics"]}
        ogType="website"
        schemaType="WebPage"
      />
      
      <div className="flex flex-col items-center justify-center mb-8 text-center">
        <div className="bg-primary/10 p-3 rounded-full mb-4">
          <Wand2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          AI Image Generator
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Create custom images for your portfolio, blog posts, or projects using OpenAI's DALL-E 3 model.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generator">Image Generator</TabsTrigger>
            <TabsTrigger value="examples">Example Prompts</TabsTrigger>
          </TabsList>
          <TabsContent value="generator" className="p-4 border rounded-md mt-2">
            {user ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ImageGenerator onImageSelect={handleImageSelect} />
                </div>
                <div className="flex flex-col items-center justify-center p-4">
                  {selectedImage ? (
                    <div className="w-full">
                      <div className="aspect-square w-full overflow-hidden rounded-lg border mb-4">
                        <img 
                          src={selectedImage} 
                          alt="Selected generated image" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-center text-sm text-muted-foreground">
                        Generated image selected for use
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="bg-muted/50 aspect-square w-2/3 mx-auto rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground px-8">
                          Generate and select an image to see it here
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        After generating an image, click "Use This Image" to select it
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <h3 className="text-xl font-medium">Authentication Required</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You need to be logged in to generate images. Login to access the AI image generation features.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/auth">Login / Register</Link>
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="examples" className="p-4 border rounded-md mt-2">
            {renderExamples()}
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Uses OpenAI's DALL-E 3 model to generate high-quality, professional images from text descriptions.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}