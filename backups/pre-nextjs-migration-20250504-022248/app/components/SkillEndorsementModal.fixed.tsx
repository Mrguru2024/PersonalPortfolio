"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Star from "lucide-react/dist/esm/icons/star";
import { useToast } from "@/hooks/use-toast";

type DBSkill = {
  id: number;
  name: string;
  category: string;
  percentage: number;
  endorsement_count: number;
};

// Create schema for form validation
const skillEndorsementFormSchema = z.object({
  skillId: z.number().positive("Skill ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email address is required"),
  comment: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
});

type SkillEndorsementFormValues = z.infer<typeof skillEndorsementFormSchema>;

interface SkillEndorsementModalProps {
  skill: DBSkill;
  isOpen: boolean;
  onClose: () => void;
  onEndorsementSubmitted: () => void;
}

export default function SkillEndorsementModal({
  skill,
  isOpen,
  onClose,
  onEndorsementSubmitted,
}: SkillEndorsementModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const { toast } = useToast();
  
  // Initialize form with default values
  const form = useForm<SkillEndorsementFormValues>({
    resolver: zodResolver(skillEndorsementFormSchema),
    defaultValues: {
      skillId: skill.id,
      name: "",
      email: "",
      comment: "",
      rating: 5,
    },
  });
  
  // Handler for star rating interaction
  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
    form.setValue("rating", rating);
  };
  
  // Submit handler
  const onSubmit = async (data: SkillEndorsementFormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/skills/${skill.id}/endorse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit endorsement");
      }
      
      // Show success message
      toast({
        title: "Endorsement submitted",
        description: `Thank you for endorsing ${skill.name}!`,
      });
      
      // Reset form and close modal
      form.reset();
      onEndorsementSubmitted();
      onClose();
    } catch (error) {
      console.error("Error submitting endorsement:", error);
      
      // Show error message
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit endorsement",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Endorse Skill: {skill.name}</DialogTitle>
          <DialogDescription>
            Share your experience with my {skill.name} skills. Your endorsement helps others understand my capabilities.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Rating selection */}
            <div className="space-y-2">
              <FormLabel>Rating</FormLabel>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleStarClick(rating)}
                    className="focus:outline-none"
                  >
                    <Star 
                      size={24}
                      className={rating <= selectedRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Hidden rating field */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} value={selectedRating} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Name field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Email field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Your email" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your email won't be displayed publicly.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Comment field */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your experience or feedback" 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Endorsement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}