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
import { Bot, User, HardDrive, Globe, Zap, AlertTriangle, Clock, Info } from 'lucide-react';
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
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';


function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
            <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
            </div>
        </div>
    );
}


function ThreatDetailsContent({
  threat,
  onAnalyze,
  isAnalyzing
}: {
  threat: ProcessedThreat;
  onAnalyze: (threatId: string) => void;
  isAnalyzing: boolean;
}) {

  return (
    <>
      <SheetHeader className='p-6 pb-4 border-b'>
            <div className='flex flex-col gap-2 text-left'>
              <div className="flex items-center gap-3">
                <RiskScoreBadge score={threat.riskScore ?? null} />
                <SheetTitle className="text-xl font-bold">{threat.event.type}</SheetTitle>
              </div>
              <SheetDescription className="text-base text-muted-foreground">
                {threat.riskExplanation}
              </SheetDescription>
            </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-6 pt-4">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="behavior" disabled={!threat.behavioralBaseline}>Behavior Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4 space-y-6">
            
            <Card>
                <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <DetailItem icon={User} label="User" value={`${threat.user.name} (${threat.user.role})`} />
                    <DetailItem icon={Clock} label="Timestamp" value={format(new Date(threat.timestamp), "PPP p")} />
                    <DetailItem icon={HardDrive} label="Host" value={threat.device.id} />
                    <DetailItem icon={Globe} label="IP Address" value={threat.location.ip} />
                    <DetailItem icon={Info} label="Details" value={threat.event.details} />
                    {threat.device.isNovel && <DetailItem icon={AlertTriangle} label="Context" value="Novel Device" />}
                    {threat.location.isNovel && <DetailItem icon={AlertTriangle} label="Context" value="Novel Location" />}
                </CardContent>
            </Card>

            <Separator />
            
            <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    ThreatLens AI™ Analysis
                </h3>
                {!threat.isAnalyzed ? (
                <Card className="text-center p-6 flex flex-col items-center bg-card/50 border-dashed">
                    <CardDescription className="mt-2 mb-4 max-w-sm">
                    This event has not been analyzed by ThreatLens AI. Run the analysis to get a detailed breakdown and enhanced risk score.
                    </CardDescription>
                    <Button onClick={() => onAnalyze(threat.id)} disabled={isAnalyzing}>
                    {isAnalyzing ? (
                        <>
                            <Zap className="mr-2 h-4 w-4 animate-pulse" />
                            Analyzing...
                        </>
                        ) : (
                        <>
                            <Zap className="mr-2 h-4 w-4" />
                            Run ThreatLens AI Analysis
                        </>
                    )}
                    </Button>
                </Card>
                ) : (
                 <Card>
                    <CardContent className="p-6 space-y-4">
                        {isAnalyzing ? (
                            <Skeleton className="h-24" />
                        ) : (
                        <p className="font-code text-sm text-muted-foreground bg-background p-4 rounded-md">
                            {threat.detailedExplanation || "No detailed explanation available."}
                        </p>
                        )}
                        {threat.riskBreakdown && (
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold">{threat.riskBreakdown.ruleBased}</div>
                                    <div className="text-xs text-muted-foreground">Rule-Based</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{threat.riskBreakdown.contextual}</div>
                                    <div className="text-xs text-muted-foreground">Contextual</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{threat.riskBreakdown.behavioral}</div>
                                    <div className="text-xs text-muted-foreground">Behavioral</div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                 </Card>
                )}
            </div>

          </TabsContent>
          
          <TabsContent value="behavior" className="mt-4">
            <BehavioralProfileView threat={threat} />
          </TabsContent>

        </Tabs>
      </div>
    </>
  );
}

export function ThreatDetailsSheet({
  threat,
  open,
  onOpenChange,
  onAnalyze,
  isAnalyzing,
}: ThreatDetailsSheetProps) {
  if (!threat) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl lg:max-w-2xl flex flex-col p-0 gap-0">
        <ThreatDetailsContent threat={threat} onAnalyze={onAnalyze} isAnalyzing={isAnalyzing} />
      </SheetContent>
    </Sheet>
  );
}

type ThreatDetailsSheetProps = {
    threat: ProcessedThreat | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAnalyze: (threatId: string) => void;
    isAnalyzing: boolean;
};
