"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star, X, ThumbsUp, Send, Loader2 } from "lucide-react/dist/esm/index";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skill } from "@/shared/schema";

// Define the form schema for skill endorsements
const skillEndorsementFormSchema = z.object({
  skillId: z.number().positive("Skill ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email address is required"),
  comment: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
});

type SkillEndorsementFormValues = z.infer<typeof skillEndorsementFormSchema>;

interface SkillEndorsementModalProps {
  skill: Skill;
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
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  
  // Initialize form
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
  
  // Form submission handler
  const onSubmit = async (data: SkillEndorsementFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Update the rating based on the state
      data.rating = rating;
      
      const response = await fetch("/api/skill-endorsements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit endorsement");
      }
      
      // Show success message
      setIsSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        onEndorsementSubmitted();
        form.reset();
        setRating(5);
        setIsSuccess(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error("Endorsement submission error:", error);
      toast({
        title: "Endorsement Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Endorse Skill: <span className="text-primary">{skill.name}</span>
          </DialogTitle>
          <DialogDescription className="text-center">
            Share your experience with {skill.name} to endorse this skill
          </DialogDescription>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-6"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <ThumbsUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
              <p className="text-muted-foreground text-center">
                Your endorsement has been submitted successfully.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-center my-4">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setRating(value);
                        form.setValue("rating", value);
                      }}
                      className="focus:outline-none"
                      aria-label={`Rate ${value} stars`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          value <= rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your email" 
                            type="email" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Your email will not be displayed publicly
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comment (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share your experience with this skill..."
                            className="min-h-20 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="mt-6">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit Endorsement
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}