'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { ProcessedThreat } from '@/lib/types';
import { Separator } from '../ui/separator';
import { RiskScoreBadge } from './risk-score-badge';
import { CheckCircle, XCircle, Zap, Bot } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BehavioralProfileView } from './behavioral-profile-view';
import { ContextFlags } from './context-flags';
import { Skeleton } from '../ui/skeleton';

function ThreatExplanationCard({ threat }: { threat: ProcessedThreat }) {
  if (!threat.isAnalyzed || !threat.riskBreakdown) {
    return null;
  }
  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader>
        <CardTitle className="text-base text-accent">
          Why This Was Flagged
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 font-code text-sm">
          {threat.riskBreakdown.ruleBased > 10 && (
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
           )}
          {threat.riskBreakdown.contextual > 10 && (
             <li className="flex items-start gap-2">
                <Zap className="mt-1 h-4 w-4 flex-shrink-0 text-amber-400" />
                <span>
                    User operating from a{' '}
                    <span className="font-bold text-foreground">novel location</span>{' '}
                    or with a <span className="font-bold text-foreground">new device</span>.
                </span>
            </li>
          )}
          {threat.riskBreakdown.behavioral > 10 && (
            <li className="flex items-start gap-2">
                <Zap className="mt-1 h-4 w-4 flex-shrink-0 text-amber-400" />
                <span>
                    Significant{' '}
                    <span className="font-bold text-foreground">
                    behavioral deviation
                    </span>{' '}
                    detected.
                </span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function ThreatDetailsContent({ 
  threat, 
  onFeedback,
  onAnalyze,
  isAnalyzing
}: { 
  threat: ProcessedThreat; 
  onFeedback: (threat: ProcessedThreat, isConfirmed: boolean) => void;
  onAnalyze: (threatId: string) => void;
  isAnalyzing: boolean;
}) {

  return (
    <>
      <SheetHeader className='p-6 pb-4'>
            <div className='flex flex-col gap-1.5 text-left'>
              <div className="flex items-center gap-2">
                <RiskScoreBadge score={threat.riskScore ?? null} />
                <h2 className="text-lg font-semibold">{threat.event.type}</h2>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(threat.timestamp).toLocaleString()}
              </div>
            </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-6 pt-0">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {threat.behavioralBaseline && <TabsTrigger value="behavior">Behavior Profile</TabsTrigger>}
          </TabsList>
          <TabsContent value="overview" className="mt-4 space-y-6">
            {!threat.isAnalyzed ? (
              <Card className="text-center p-6 flex flex-col items-center">
                <Bot className="h-12 w-12 text-muted-foreground" />
                <CardTitle className="mt-4 text-xl">Ready for Analysis</CardTitle>
                <CardDescription className="mt-2">
                  This event has not been analyzed by ThreatLens AI.
                </CardDescription>
                <Button className="mt-4" onClick={() => onAnalyze(threat.id)} disabled={isAnalyzing}>
                  {isAnalyzing ? "Analyzing..." : "Analyze with ThreatLens AI"}
                </Button>
              </Card>
            ) : (
              <>
                <ThreatExplanationCard threat={threat} />
                <Separator />
                <ContextFlags threat={threat} />
                <Separator />
                <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">
                        ThreatLens AI™ Explanation
                    </h3>
                    <p className="rounded-lg bg-card p-4 font-code text-sm text-muted-foreground shadow-sm">
                        {isAnalyzing 
                          ? <Skeleton className="h-20" /> 
                          : threat.detailedExplanation || "No explanation available."
                        }
                    </p>
                </div>
              </>
            )}
          </TabsContent>
          {threat.behavioralBaseline && (
            <TabsContent value="behavior" className="mt-4">
              <BehavioralProfileView threat={threat} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <div className="mt-auto border-t bg-card/50 p-4">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onFeedback(threat, false)}
            disabled={!threat.isAnalyzed}
          >
            <XCircle /> Mark as Benign
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => onFeedback(threat, true)}
            disabled={!threat.isAnalyzed}
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
  onAnalyze,
  isAnalyzing,
}: ThreatDetailsSheetProps) {
  if (!threat) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetTitle className="sr-only">
          Threat Details: {threat.event.type}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Detailed information for security event {threat.id}.
        </SheetDescription>
        <ThreatDetailsContent threat={threat} onFeedback={onFeedback} onAnalyze={onAnalyze} isAnalyzing={isAnalyzing} />
      </SheetContent>
    </Sheet>
  );
}
type ThreatDetailsSheetProps = {
    threat: ProcessedThreat | null;
    onFeedback: (threat: ProcessedThreat, isConfirmed: boolean) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAnalyze: (threatId: string) => void;
    isAnalyzing: boolean;
};
