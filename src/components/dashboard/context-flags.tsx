'use client';

import { Badge } from '../ui/badge';
import { HardDrive, Globe, AlertTriangle } from 'lucide-react';
import type { ProcessedThreat } from '@/lib/types';

export function ContextFlags({ threat }: { threat: ProcessedThreat }) {
  const flags: { icon: React.ElementType; label: string; variant: string }[] = [];

  if (threat.device.isNovel) {
    flags.push({
      icon: HardDrive,
      label: 'New Device',
      variant: 'border-orange-400/50 bg-orange-400/10 text-orange-300',
    });
  }

  if (threat.location.isNovel) {
    flags.push({
      icon: Globe,
      label: 'Novel Location',
      variant: 'border-sky-400/50 bg-sky-400/10 text-sky-300',
    });
  }

  if (threat.event.type === 'Privilege Escalation') {
    flags.push({
      icon: AlertTriangle,
      label: 'Privilege Escalation',
      variant: 'border-red-400/50 bg-red-400/10 text-red-300',
    });
  }

  if (flags.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-foreground">Context Flags</h3>
      <div className="flex flex-wrap gap-2">
        {flags.map((flag, idx) => (
          <Badge key={idx} variant="outline" className={flag.variant}>
            <flag.icon className="mr-1 h-3 w-3" />
            {flag.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
