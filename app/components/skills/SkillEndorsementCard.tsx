import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp } from 'lucide-react';
import { type SkillEndorsement } from '@shared/schema';
import { format } from 'date-fns';

interface SkillEndorsementCardProps {
  endorsement: SkillEndorsement;
}

const SkillEndorsementCard: React.FC<SkillEndorsementCardProps> = ({ endorsement }) => {
  // Format the date
  const formattedDate = format(
    new Date(endorsement.createdAt),
    'MMM d, yyyy'
  );
  
  // Only show the first letter and last initial of the endorser for privacy
  const getPrivateName = (name: string) => {
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0]} ${nameParts[1][0]}.`;
    }
    return name;
  };
  
  return (
    <Card className="w-full mb-4 overflow-hidden border border-border hover:border-primary/50 transition-all">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="rounded-full bg-muted w-8 h-8 flex items-center justify-center text-muted-foreground mr-2">
              {endorsement.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{getPrivateName(endorsement.name)}</p>
              <div className="flex mt-1">
                {Array.from({ length: endorsement.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary mr-0.5" />
                ))}
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {formattedDate}
          </Badge>
        </div>
        
        {endorsement.comment && (
          <div className="mt-3 text-sm text-muted-foreground">
            "{endorsement.comment}"
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillEndorsementCard;