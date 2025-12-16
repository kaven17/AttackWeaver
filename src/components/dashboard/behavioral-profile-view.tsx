'use client';

import type { ProcessedThreat } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Hourglass, Route, Zap } from 'lucide-react';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

const AnomalyMarker = ({ isAnomaly }: { isAnomaly: boolean }) =>
  isAnomaly ? (
    <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5">
      DEV
    </Badge>
  ) : null;

export function BehavioralProfileView({ threat }: { threat: ProcessedThreat }) {
  if (!threat.isAnalyzed || !threat.behavioralBaseline) {
    return (
        <div className="text-center text-muted-foreground p-8">
            <p>Run ThreatLens AI analysis to generate the behavioral profile.</p>
        </div>
    );
  }

  const eventHour = new Date(threat.timestamp).getHours();
  const [startHour, endHour] = threat.behavioralBaseline.loginTime.normalRange;
  const isTimeAnomaly = eventHour < startHour || eventHour > endHour;

  // Simple check for deviation, in a real app this would be more complex
  const isResourceAnomaly = threat.event.type === 'Resource Access' && threat.behavioralAnomalyScore && threat.behavioralAnomalyScore > 0.5;
  const isApiAnomaly = threat.event.type === 'API Call' && threat.behavioralAnomalyScore && threat.behavioralAnomalyScore > 0.7;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hourglass className="h-5 w-5" /> Login Time Baseline
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <AnomalyMarker isAnomaly={isTimeAnomaly} />
          <div className="text-sm text-muted-foreground">
            Normal hours: {startHour}:00 - {endHour}:00
          </div>
          <div className="font-bold text-lg text-foreground">
            Current Event: {format(new Date(threat.timestamp), 'HH:mm')}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="h-5 w-5" /> Resource Access Pattern
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
            <AnomalyMarker isAnomaly={isResourceAnomaly} />
            <div className="text-sm text-muted-foreground">
                Typical first resource: <Badge variant="secondary">/dashboard</Badge>
            </div>
            <div className="font-bold text-lg text-foreground">
                Event Resource: <Badge variant={isResourceAnomaly ? "destructive" : "secondary"}>{threat.event.details.split(' ')[2] || 'N/A'}</Badge>
            </div>
        </CardContent>
      </Card>

        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-5 w-5" /> API Call Frequency
            </CardTitle>
            </CardHeader>
            <CardContent className="relative">
                <AnomalyMarker isAnomaly={isApiAnomaly} />
                <div className="text-sm text-muted-foreground">
                    Baseline: ~{threat.behavioralBaseline.apiCallFrequency.mean} calls/hr
                </div>
                <div className="font-bold text-lg text-foreground">
                    Current: {isApiAnomaly ? (threat.behavioralBaseline.apiCallFrequency.mean + threat.behavioralBaseline.apiCallFrequency.stdDev * 3).toFixed(0) : (threat.behavioralBaseline.apiCallFrequency.mean - 2).toFixed(0)} calls/hr (simulated)
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
