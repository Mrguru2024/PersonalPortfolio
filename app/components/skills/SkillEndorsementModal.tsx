import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { type Skill, type SkillEndorsement, skillEndorsementFormSchema } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import SkillEndorsementCard from './SkillEndorsementCard';
import { Star } from 'lucide-react';

interface SkillEndorsementModalProps {
  skill: Skill;
  isOpen: boolean;
  onClose: () => void;
}

type FormData = z.infer<typeof skillEndorsementFormSchema>;

const SkillEndorsementModal: React.FC<SkillEndorsementModalProps> = ({ 
  skill, 
  isOpen, 
  onClose 
}) => {
  const [rating, setRating] = useState(5);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormData>({
    resolver: zodResolver(skillEndorsementFormSchema),
    defaultValues: {
      skillId: skill.id,
      name: '',
      email: '',
      comment: '',
      rating: 5
    }
  });
  
  // Fetch existing endorsements for this skill
  const { data: endorsements = [], isLoading: isLoadingEndorsements } = useQuery({
    queryKey: ['/api/skill-endorsements', skill.id],
    queryFn: async () => {
      const res = await fetch(`/api/skill-endorsements?skillId=${skill.id}`);
      if (!res.ok) throw new Error('Failed to fetch endorsements');
      return res.json();
    },
    enabled: isOpen, // Only fetch when modal is open
  });
  
  // Submit endorsement mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest('POST', '/api/skill-endorsements', data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit endorsement');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Endorsement submitted',
        description: `Thank you for endorsing ${skill.name}!`,
      });
      form.reset();
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/skill-endorsements', skill.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/skills'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Failed to submit endorsement',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (data: FormData) => {
    // Make sure to include the current rating in the submission
    mutate({ ...data, rating });
  };
  
  const handleRatingClick = (value: number) => {
    setRating(value);
    form.setValue('rating', value);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Endorse this skill: {skill.name}</DialogTitle>
          <DialogDescription>
            Share your endorsement for {skill.name}. Your feedback helps others understand Anthony's skill level.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleRatingClick(value)}
                    className="text-2xl p-1 focus:outline-none transition-colors"
                  >
                    <Star 
                      className={`h-8 w-8 transition-all ${
                        value <= rating 
                        ? 'text-primary fill-primary' 
                        : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="your.email@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your experience with Anthony's skills..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Submitting...' : 'Submit Endorsement'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        
        {/* Show existing endorsements */}
        {endorsements.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              Recent Endorsements
            </h3>
            <div className="max-h-[200px] overflow-y-auto pr-2">
              {endorsements.slice(0, 3).map((endorsement: SkillEndorsement) => (
                <SkillEndorsementCard 
                  key={endorsement.id} 
                  endorsement={endorsement} 
                />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SkillEndorsementModal;