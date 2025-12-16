'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProcessedThreat } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { RiskScoreBadge } from './risk-score-badge';
import { cn } from '@/lib/utils';
import { CardHeader, CardTitle, CardDescription } from '../ui/card';

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
  return (
    <>
    <CardHeader>
        <CardTitle>Security Events</CardTitle>
        <CardDescription>High-risk events detected by the AI engine.</CardDescription>
    </CardHeader>
    <div className="relative overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Score</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {threats.map(threat => (
            <TableRow
              key={threat.id}
              onClick={() => onSelectThreat(threat)}
              className={cn(
                'cursor-pointer',
                selectedThreatId === threat.id && 'bg-muted/50'
              )}
            >
              <TableCell>
                <RiskScoreBadge score={threat.riskScore} />
              </TableCell>
              <TableCell>
                <div className="font-medium">{threat.event.type}</div>
                <div className="hidden text-sm text-muted-foreground md:inline">
                  {threat.event.details}
                </div>
              </TableCell>
              <TableCell>
                <div>{threat.user.name}</div>
                <div className="text-muted-foreground">{threat.user.role}</div>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatDistanceToNow(new Date(threat.timestamp), {
                  addSuffix: true,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </>
  );
}
