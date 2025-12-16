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
  Globe,
  HardDrive,
  Info,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/button';

type ThreatDetailsSheetProps = {
  threat: ProcessedThreat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3">
    <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  </div>
);

export function ThreatDetailsSheet({
  threat,
  open,
  onOpenChange,
}: ThreatDetailsSheetProps) {
  if (!threat) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="pr-12">
          <SheetTitle className="flex items-center gap-2">
            Event Details
            <RiskScoreBadge score={threat.riskScore} />
          </SheetTitle>
          <SheetDescription>
            {new Date(threat.timestamp).toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 p-1 pr-4">
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
             <DetailItem icon={Zap} label="Event Type" value={threat.event.type} />
             <DetailItem icon={Info} label="Description" value={threat.event.details} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailItem icon={User} label="User" value={`${threat.user.name} (${threat.user.role})`} />
            <DetailItem icon={Globe} label="Location" value={`${threat.location.country} (${threat.location.ip})`} />
            <DetailItem icon={HardDrive} label="Device ID" value={threat.device.id.split('-')[0]} />
            <DetailItem icon={ShieldCheck} label="Rule Severity" value={String(threat.ruleBasedSeverity)} />
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-foreground">
              CyberDNA™ Analysis
            </h3>
            <p className="mt-2 rounded-lg bg-card p-4 font-code text-sm text-muted-foreground shadow-sm">
              {threat.behavioralExplanation}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">
              ThreatLens AI™ Explanation
            </h3>
            <p className="mt-2 rounded-lg bg-card p-4 font-code text-sm text-muted-foreground shadow-sm">
              {threat.detailedExplanation}
            </p>
          </div>
        </div>

        <SheetFooter className="mt-auto border-t pt-4">
          <Button variant="secondary">Mark as Benign</Button>
          <Button variant="destructive">Escalate</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
