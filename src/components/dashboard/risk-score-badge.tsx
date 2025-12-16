import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

export function RiskScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
      return (
        <Badge
            variant="outline"
            className={cn(
                'w-[50px] justify-center font-mono text-sm font-bold bg-muted/20 text-muted-foreground border-muted-foreground/20'
            )}
        >
            <HelpCircle className="h-4 w-4" />
        </Badge>
      )
  }
  
  const colorClass =
    score >= 70
      ? 'bg-risk-high/10 text-risk-high border-risk-high/20'
      : score >= 40
      ? 'bg-risk-medium/10 text-risk-medium border-risk-medium/20'
      : 'bg-risk-low/10 text-risk-low border-risk-low/20';

  return (
    <Badge
      variant="outline"
      className={cn(
        'w-[50px] justify-center font-mono text-sm font-bold',
        colorClass
      )}
    >
      {score.toFixed(0)}
    </Badge>
  );
}
