'use client';

import { ProcessedThreat } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { RiskScoreBadge } from './risk-score-badge';
import { cn } from '@/lib/utils';
import { CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type ThreatListProps = {
  threats: ProcessedThreat[];
  onSelectThreat: (threat: ProcessedThreat) => void;
  selectedThreatId?: string | null;
};

export function ThreatList({
  threats,
  onSelectThreat,
  selectedThreatId,
}: ThreatListProps) {
  if (threats.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No security events detected in the last 7 days.
      </div>
    );
  }

  // Sort by riskScore descending by default
  const sortedThreats = [...threats].sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));

  return (
    <>
      <CardHeader>
        <CardTitle>Security Events</CardTitle>
        <CardDescription>
          {threats.length} events detected in the last 7 days.
        </CardDescription>
      </CardHeader>

      <div className="relative flex-1 h-96">
        <ScrollArea className="absolute inset-0 h-full w-full">
          <div className="min-w-[900px]">
  <Table className="min-w-max">
            <TableHeader>
              <TableRow>
<TableHead className="w-[100px] whitespace-nowrap">Score</TableHead>
<TableHead className="min-w-[300px] whitespace-nowrap">Event</TableHead>
<TableHead className="min-w-[180px] whitespace-nowrap">User</TableHead>
<TableHead className="min-w-[140px] whitespace-nowrap text-right">Time</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedThreats.map((threat) => (
                <TableRow
                  key={threat.id}
                  onClick={() => onSelectThreat(threat)}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-muted/30',
                    selectedThreatId === threat.id && 'bg-muted/50',
                    threat.isAnalyzed ? 'opacity-100' : 'opacity-70'
                  )}
                >
                  {/* Risk Score */}
                  <TableCell className="whitespace-nowrap">
                    <RiskScoreBadge score={threat.riskScore ?? 0} />
                  </TableCell>

                  {/* Event */}
                  <TableCell className="whitespace-nowrap">
                    <div className="font-medium">{threat.event.type}</div>
                    <div
                      className="hidden md:inline text-sm text-muted-foreground truncate max-w-xs"
                      title={threat.event.details}
                    >
                      {threat.event.details}
                    </div>
                  </TableCell>

                  {/* User */}
                  <TableCell className="whitespace-nowrap">
                    <div>{threat.user.name}</div>
                    <div className="text-muted-foreground">{threat.user.role}</div>
                  </TableCell>

                  {/* Timestamp */}
                  <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(threat.timestamp), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
</div>
        </ScrollArea>
      </div>
    </>
  );
}
