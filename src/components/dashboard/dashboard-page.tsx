'use client';

import { useState } from 'react';
import type { ProcessedThreat } from '@/lib/types';
import { OverviewCards } from './overview-cards';
import { ThreatList } from './threat-list';
import { ThreatDetailsSheet } from './threat-details-sheet';
import { ThreatDistributionChart } from './threat-distribution-chart';
import { Card } from '../ui/card';

export function DashboardPage({ threats }: { threats: ProcessedThreat[] }) {
  const [selectedThreat, setSelectedThreat] = useState<ProcessedThreat | null>(
    null
  );

  const highRiskCount = threats.filter(t => t.riskScore >= 70).length;
  const mediumRiskCount = threats.filter(
    t => t.riskScore >= 40 && t.riskScore < 70
  ).length;
  const lowRiskCount = threats.filter(t => t.riskScore < 40).length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Threat Intelligence Dashboard
        </h1>
        <p className="text-muted-foreground">
          AI-powered analysis of security events.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <OverviewCards
              totalThreats={threats.length}
              highRiskCount={highRiskCount}
              mediumRiskCount={mediumRiskCount}
            />
        </div>
        <Card className="lg:col-span-1">
            <ThreatDistributionChart
                lowRiskCount={lowRiskCount}
                mediumRiskCount={mediumRiskCount}
                highRiskCount={highRiskCount}
            />
        </Card>
      </div>

      <Card>
        <ThreatList
          threats={threats}
          onSelectThreat={setSelectedThreat}
          selectedThreatId={selectedThreat?.id}
        />
      </Card>

      <ThreatDetailsSheet
        threat={selectedThreat}
        open={!!selectedThreat}
        onOpenChange={open => {
          if (!open) {
            setSelectedThreat(null);
          }
        }}
      />
    </div>
  );
}
