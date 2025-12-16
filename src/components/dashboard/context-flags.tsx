'use client';
import { Badge } from '../ui/badge';
import { HardDrive, Globe, AlertTriangle } from 'lucide-react';
import type { ProcessedThreat } from '@/lib/types';

export function ContextFlags({ threat }: { threat: ProcessedThreat }) {
  return (
    <div className='space-y-3'>
        <h3 className="font-semibold text-foreground">
            Context Flags
        </h3>
        <div className="flex flex-wrap gap-2">
        {threat.device.isNovel && (
            <Badge variant="outline" className="border-orange-400/50 bg-orange-400/10 text-orange-300">
            <HardDrive className="mr-1 h-3 w-3" />
            New Device
            </Badge>
        )}
        {threat.location.isNovel && (
            <Badge variant="outline" className="border-sky-400/50 bg-sky-400/10 text-sky-300">
            <Globe className="mr-1 h-3 w-3" />
            Novel Location
            </Badge>
        )}
        {threat.event.type === 'Privilege Escalation' && (
            <Badge variant="outline" className="border-red-400/50 bg-red-400/10 text-red-300">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Privilege Escalation
            </Badge>
        )}
        </div>
    </div>
  );
}
