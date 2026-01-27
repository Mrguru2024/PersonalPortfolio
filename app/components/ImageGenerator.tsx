import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Download, Image as ImageIcon, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

interface ImageGeneratorProps {
  onImageSelect?: (imageUrl: string) => void;
  className?: string;
  defaultPrompt?: string;
}

export default function ImageGenerator({ onImageSelect, className, defaultPrompt = '' }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [size, setSize] = useState<'1024x1024' | '1024x1792' | '1792x1024'>('1024x1024');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Mutation for generating images
  const { mutate: generateImage, isPending, isSuccess, data } = useMutation({
    mutationFn: async (formData: { 
      prompt: string; 
      size: '1024x1024' | '1024x1792' | '1792x1024';
      quality: 'standard' | 'hd';
    }) => {
      const response = await apiRequest('POST', '/api/images/generate', formData);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate image');
      }
      
      return data.data as GeneratedImage;
    },
    onSuccess: (data) => {
      toast({
        title: 'Image Generated',
        description: 'Your image has been successfully created',
        variant: 'default',
      });
      
      // Automatically select the image if onImageSelect callback exists
      if (onImageSelect && data.url) {
        onImageSelect(data.url);
        setSelectedImage(data.url);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate image',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt || prompt.trim().length < 10) {
      toast({
        title: 'Invalid Prompt',
        description: 'Please enter a descriptive prompt (at least 10 characters)',
        variant: 'destructive',
      });
      return;
    }
    
    generateImage({ prompt, size, quality });
  };

  const handleDownload = () => {
    if (!data?.url) return;
    
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = data.url;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectImage = () => {
    if (data?.url && onImageSelect) {
      onImageSelect(data.url);
      setSelectedImage(data.url);
      
      toast({
        title: 'Image Selected',
        description: 'The generated image has been selected',
        variant: 'default',
      });
    }
  };

  if (!user) {
    return (
      <Card className={cn("p-4 text-center", className)}>
        <ImageIcon className="mx-auto mb-2 text-muted-foreground" size={48} />
        <p className="mb-2">You need to be logged in to generate images.</p>
        <p className="text-sm text-muted-foreground">Please log in to access the image generation feature.</p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-lg font-semibold">AI Image Generator</h2>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-1">
            Describe the image you want
          </label>
          <Textarea 
            id="prompt"
            placeholder="Enter a detailed description of the image you want to generate... (e.g. A futuristic tech workspace with holographic displays)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-24"
            disabled={isPending}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="size" className="block text-sm font-medium mb-1">
              Image Size
            </label>
            <Select 
              value={size} 
              onValueChange={(value) => setSize(value as any)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">Square (1:1)</SelectItem>
                <SelectItem value="1024x1792">Portrait (9:16)</SelectItem>
                <SelectItem value="1792x1024">Landscape (16:9)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="quality" className="block text-sm font-medium mb-1">
              Image Quality
            </label>
            <Select 
              value={quality} 
              onValueChange={(value) => setQuality(value as any)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="hd">HD (Higher Detail)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isPending || !prompt.trim() || prompt.trim().length < 10}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Image'
          )}
        </Button>
      </form>
      
      {isSuccess && data?.url && (
        <div className="mt-6 space-y-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
            <img 
              src={data.url} 
              alt={prompt || 'Generated image'} 
              className="h-full w-full object-cover transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              className="flex-1 sm:flex-none"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            
            {onImageSelect && (
              <Button 
                variant={selectedImage === data.url ? "secondary" : "default"}
                size="sm" 
                onClick={handleSelectImage}
                className="flex-1 sm:flex-none"
                disabled={selectedImage === data.url}
              >
                {selectedImage === data.url ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Selected
                  </>
                ) : (
                  'Use This Image'
                )}
              </Button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Generated {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}