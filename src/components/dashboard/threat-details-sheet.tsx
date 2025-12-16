'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import type { ProcessedThreat } from '@/lib/types';
import { Separator } from '../ui/separator';
import { RiskScoreBadge } from './risk-score-badge';
import {
  CheckCircle,
  XCircle,
  FileCode,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BehavioralProfileView } from './behavioral-profile-view';
import { ContextFlags } from './context-flags';
import { useToast } from '@/hooks/use-toast';

function ThreatExplanationCard({ threat }: { threat: ProcessedThreat }) {
  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader>
        <CardTitle className="text-base text-accent">
          Why This Was Flagged
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 font-code text-sm">
          <li className="flex items-start gap-2">
            <Zap className="mt-1 h-4 w-4 flex-shrink-0 text-amber-400" />
            <span>
              High rule-based severity of{' '}
              <span className="font-bold text-foreground">
                {threat.ruleBasedSeverity}
              </span>{' '}
              for a "{threat.event.type}" event.
            </span>
          </li>
          {threat.location.isNovel && (
            <li className="flex items-start gap-2">
              <Zap className="mt-1 h-4 w-4 flex-shrink-0 text-amber-400" />
              <span>
                User operating from a{' '}
                <span className="font-bold text-foreground">novel location</span>{' '}
                ({threat.location.country}).
              </span>
            </li>
          )}
          {threat.device.isNovel && (
            <li className="flex items-start gap-2">
              <Zap className="mt-1 h-4 w-4 flex-shrink-0 text-amber-400" />
              <span>
                Access from a{' '}
                <span className="font-bold text-foreground">new device</span>.
              </span>
            </li>
          )}
          {threat.behavioralAnomalyScore > 0.5 && (
            <li className="flex items-start gap-2">
              <Zap className="mt-1 h-4 w-4 flex-shrink-0 text-amber-400" />
              <span>
                Significant{' '}
                <span className="font-bold text-foreground">
                  behavioral deviation
                </span>{' '}
                detected by CyberDNA™.
              </span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function ThreatDetailsContent({ threat }: { threat: ProcessedThreat }) {
  const { toast } = useToast();

  const handleFeedback = (isThreat: boolean) => {
    toast({
      title: 'Feedback Received',
      description: `Risk model updated for similar future events. ${
        isThreat ? '+8' : '-5'
      } future risk weight applied.`,
    });
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="behavior">Behavior Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4 space-y-6">
            <ThreatExplanationCard threat={threat} />

            <Separator />
            
            <ContextFlags threat={threat} />

            <Separator />
            
            <div className="space-y-2">
                <h3 className="font-semibold text-foreground">
                    ThreatLens AI™ Explanation
                </h3>
                <p className="rounded-lg bg-card p-4 font-code text-sm text-muted-foreground shadow-sm">
                    {threat.detailedExplanation}
                </p>
            </div>
            
          </TabsContent>
          <TabsContent value="behavior" className="mt-4">
            <BehavioralProfileView threat={threat} />
          </TabsContent>
        </Tabs>
      </div>

      <SheetFooter className="mt-auto border-t bg-card/50 p-4">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleFeedback(false)}
          >
            <XCircle /> Mark as Benign
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => handleFeedback(true)}
          >
            <CheckCircle /> Confirm Threat
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}

export function ThreatDetailsSheet({
  threat,
  open,
  onOpenChange,
  isSheet = true,
}: ThreatDetailsSheetProps) {
  if (!threat) return null;

  const header = (
    <>
      <div className="flex items-center gap-2">
        <RiskScoreBadge score={threat.riskScore} />
        <h2 className="text-lg font-semibold">{threat.event.type}</h2>
      </div>
      <div className="text-sm text-muted-foreground">
        {new Date(threat.timestamp).toLocaleString()}
      </div>
    </>
  );

  if (!isSheet) {
    return (
      <Card className="h-full flex flex-col">
          <CardHeader>
            {header}
          </CardHeader>
          <ThreatDetailsContent threat={threat} />
      </Card>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className='p-6 pb-4'>
            <SheetTitle asChild>{header}</SheetTitle>
        </SheetHeader>
        <ThreatDetailsContent threat={threat} />
      </SheetContent>
    </Sheet>
  );
}
type ThreatDetailsSheetProps = {
    threat: ProcessedThreat | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isSheet?: boolean;
};
