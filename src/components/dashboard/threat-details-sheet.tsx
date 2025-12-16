'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ProcessedThreat } from '@/lib/types';
import { Separator } from '../ui/separator';
import { RiskScoreBadge } from './risk-score-badge';
import { CheckCircle, XCircle, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BehavioralProfileView } from './behavioral-profile-view';
import { ContextFlags } from './context-flags';

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

function ThreatDetailsContent({ threat, onFeedback }: { threat: ProcessedThreat; onFeedback: (threat: ProcessedThreat, isConfirmed: boolean) => void; }) {

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

      <div className="mt-auto border-t bg-card/50 p-4">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onFeedback(threat, false)}
          >
            <XCircle /> Mark as Benign
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => onFeedback(threat, true)}
          >
            <CheckCircle /> Confirm Threat
          </Button>
        </div>
      </div>
    </>
  );
}

export function ThreatDetailsSheet({
  threat,
  onFeedback,
  open,
  onOpenChange,
  isSheet = true,
}: ThreatDetailsSheetProps) {
  if (!threat) return null;

  const header = (
    <div className='flex flex-col gap-1.5'>
      <div className="flex items-center gap-2">
        <RiskScoreBadge score={threat.riskScore} />
        <h2 className="text-lg font-semibold">{threat.event.type}</h2>
      </div>
      <div className="text-sm text-muted-foreground">
        {new Date(threat.timestamp).toLocaleString()}
      </div>
    </div>
  );

  if (!isSheet) {
    return (
      <Card className="h-full flex flex-col">
          <CardHeader>
            {header}
          </CardHeader>
          <ThreatDetailsContent threat={threat} onFeedback={onFeedback} />
      </Card>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className='p-6 pb-4'>
            <SheetTitle asChild>{header}</SheetTitle>
        </SheetHeader>
        <ThreatDetailsContent threat={threat} onFeedback={onFeedback} />
      </SheetContent>
    </Sheet>
  );
}
type ThreatDetailsSheetProps = {
    threat: ProcessedThreat | null;
    onFeedback: (threat: ProcessedThreat, isConfirmed: boolean) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isSheet?: boolean;
};
