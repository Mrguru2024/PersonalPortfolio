import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Tag } from './RecommendationTag';
import { useToast } from '@/hooks/use-toast';

// Form schema for recommendation request
const RecommendationFormSchema = z.object({
  interests: z.string().min(1, 'Please enter at least one interest'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  preferredTechnologies: z.string().optional(),
  purpose: z.string().optional(),
  searchQuery: z.string().optional(),
});

type RecommendationFormValues = z.infer<typeof RecommendationFormSchema>;

interface RecommendationResponse {
  success: boolean;
  data: {
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
  };
  error?: string;
  message?: string;
}

interface ProjectRecommendationFormProps {
  onRecommendationsReceived: (data: RecommendationResponse['data']) => void;
}

const ProjectRecommendationForm: React.FC<ProjectRecommendationFormProps> = ({
  onRecommendationsReceived
}) => {
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState<string>('');
  const [preferredTechs, setPreferredTechs] = useState<string[]>([]);
  const [techInput, setTechInput] = useState<string>('');
  const { toast } = useToast();

  // Initialize form with default values
  const form = useForm<RecommendationFormValues>({
    resolver: zodResolver(RecommendationFormSchema),
    defaultValues: {
      interests: '',
      experienceLevel: 'intermediate',
      preferredTechnologies: '',
      purpose: '',
      searchQuery: '',
    },
  });

  // Mutation for submitting the form
  const recommendationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/recommendations', data);
      return response.json();
    },
    onSuccess: (data: RecommendationResponse) => {
      if (data.success && data.data) {
        onRecommendationsReceived(data.data);
        toast({
          title: 'Recommendations Generated',
          description: 'We\'ve found some projects that match your interests!',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to generate recommendations',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: RecommendationFormValues) => {
    // Convert comma-separated interests to array if no tags were added
    const interestsArray = interests.length > 0 
      ? interests 
      : values.interests.split(',').map(item => item.trim()).filter(Boolean);
    
    // Convert comma-separated technologies to array if no tags were added
    const techsArray = preferredTechs.length > 0
      ? preferredTechs
      : values.preferredTechnologies 
        ? values.preferredTechnologies.split(',').map(item => item.trim()).filter(Boolean)
        : undefined;

    recommendationMutation.mutate({
      interests: interestsArray,
      experienceLevel: values.experienceLevel,
      preferredTechnologies: techsArray,
      purpose: values.purpose,
      searchQuery: values.searchQuery,
    });
  };

  // Add interest tag
  const addInterestTag = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  // Remove interest tag
  const removeInterestTag = (tag: string) => {
    setInterests(interests.filter(t => t !== tag));
  };

  // Add technology tag
  const addTechTag = () => {
    if (techInput.trim() && !preferredTechs.includes(techInput.trim())) {
      setPreferredTechs([...preferredTechs, techInput.trim()]);
      setTechInput('');
    }
  };

  // Remove technology tag
  const removeTechTag = (tag: string) => {
    setPreferredTechs(preferredTechs.filter(t => t !== tag));
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Find Your Perfect Project Match
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="interests"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md font-semibold">What are you interested in?</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {interests.map((tag, index) => (
                    <Tag 
                      key={index} 
                      text={tag} 
                      onRemove={() => removeInterestTag(tag)} 
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., web development, AI, mobile apps"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addInterestTag();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addInterestTag}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter to add multiple interests or separate with commas
                </p>
                <input 
                  type="hidden" 
                  {...field} 
                  value={interests.join(',')} 
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experienceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md font-semibold">Experience Level</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredTechnologies"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md font-semibold">Preferred Technologies (Optional)</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {preferredTechs.map((tag, index) => (
                    <Tag 
                      key={index} 
                      text={tag} 
                      onRemove={() => removeTechTag(tag)} 
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., React, Node.js, Python"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTechTag();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addTechTag}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  What technologies are you comfortable with or interested in learning?
                </p>
                <input 
                  type="hidden" 
                  {...field} 
                  value={preferredTechs.join(',')} 
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md font-semibold">Purpose (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Why are you looking for a project?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="learning">Learning new skills</SelectItem>
                    <SelectItem value="portfolio">Building my portfolio</SelectItem>
                    <SelectItem value="hiring">Finding developers to hire</SelectItem>
                    <SelectItem value="collaboration">Looking for collaborators</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="searchQuery"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md font-semibold">Specific Query (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe in a sentence or two what you're looking for..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            disabled={recommendationMutation.isPending}
          >
            {recommendationMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating recommendations...
              </>
            ) : (
              'Get Personalized Recommendations'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ProjectRecommendationForm;