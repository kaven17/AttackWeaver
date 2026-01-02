'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ProcessedThreat } from '@/lib/types';
import { Separator } from '../ui/separator';
import { RiskScoreBadge } from './risk-score-badge';
import {
  Bot,
  User,
  HardDrive,
  Globe,
  AlertTriangle,
  Clock,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BehavioralProfileView } from './behavioral-profile-view';
import { format } from 'date-fns';
import Link from 'next/link';

type DetailItemProps = {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
};

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
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

type ThreatDetailsContentProps = {
  threat: ProcessedThreat;
};

function ThreatDetailsContent({ threat }: ThreatDetailsContentProps) {
  return (
    <>
      <SheetHeader className="p-6 pb-4 border-b">
        <div className="flex flex-col gap-2 text-left">
          <div className="flex items-center gap-3">
            <RiskScoreBadge score={threat.riskScore ?? 0} />
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
            <TabsTrigger value="behavior" disabled={!threat.behavioralBaseline}>
              Behavior Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <DetailItem
                  icon={User}
                  label="User"
                  value={`${threat.user.name} (${threat.user.role})`}
                />
                <DetailItem
                  icon={Clock}
                  label="Timestamp"
                  value={format(new Date(threat.timestamp), 'PPP p')}
                />
                <DetailItem icon={HardDrive} label="Host" value={threat.device.id} />
                <DetailItem icon={Globe} label="IP Address" value={threat.location.ip} />
                <DetailItem icon={Info} label="Details" value={threat.event.details} />
                {threat.device.isNovel && (
                  <DetailItem icon={AlertTriangle} label="Context" value="Novel Device" />
                )}
                {threat.location.isNovel && (
                  <DetailItem icon={AlertTriangle} label="Context" value="Novel Location" />
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* AI Analysis CTA */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Bot className="h-5 w-5" />
                ThreatLens AI™ Analysis
              </h3>
              <Card className="text-center p-6 flex flex-col items-center bg-card/50 border-dashed">
                <CardDescription className="mt-2 mb-4 max-w-sm">
                  For a deeper, AI-powered analysis of behavioral patterns and event correlation,
                  proceed to the Analysis page.
                </CardDescription>
                <Button asChild>
                  <Link href={`/analysis/${threat.id}`}>
                    Go to Analysis Page
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* Behavior Profile */}
          <TabsContent value="behavior" className="mt-4">
            {threat.behavioralBaseline ? (
              <BehavioralProfileView threat={threat} />
            ) : (
              <p className="text-muted-foreground text-center p-4">
                No behavioral baseline data available.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

type ThreatDetailsSheetProps = {
  threat: ProcessedThreat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ThreatDetailsSheet({
  threat,
  open,
  onOpenChange,
}: ThreatDetailsSheetProps) {
  if (!threat) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl lg:max-w-2xl flex flex-col p-0 gap-0">
        <ThreatDetailsContent threat={threat} />
      </SheetContent>
    </Sheet>
  );
}
