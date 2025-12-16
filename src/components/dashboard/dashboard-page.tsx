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
    threats[0] || null
  );

  const highRiskCount = threats.filter(t => t.riskScore >= 70).length;
  const mediumRiskCount = threats.filter(
    t => t.riskScore >= 40 && t.riskScore < 70
  ).length;
  const lowRiskCount = threats.filter(t => t.riskScore < 40).length;

  return (
    <div className="flex flex-1 flex-col @container">
      <header className="p-4 sm:p-6">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Threat Intelligence Dashboard
        </h1>
        <p className="text-muted-foreground">
          AI-powered analysis of security events.
        </p>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_350px] gap-6 p-4 sm:p-6 pt-0">
        <div className="flex flex-col gap-6">
          <OverviewCards
            totalThreats={threats.length}
            highRiskCount={highRiskCount}
            mediumRiskCount={mediumRiskCount}
          />
          <Card className='flex-1 flex flex-col'>
            <ThreatList
              threats={threats}
              onSelectThreat={setSelectedThreat}
              selectedThreatId={selectedThreat?.id}
            />
          </Card>
        </div>
        <div className="hidden md:flex flex-col gap-6">
            <Card>
                <ThreatDistributionChart
                    lowRiskCount={lowRiskCount}
                    mediumRiskCount={mediumRiskCount}
                    highRiskCount={highRiskCount}
                />
            </Card>
            {selectedThreat && (
                <div className='flex-1'>
                    <ThreatDetailsSheet
                        threat={selectedThreat}
                        open={!!selectedThreat}
                        onOpenChange={open => {
                        if (!open) {
                            setSelectedThreat(null);
                        }
                        }}
                        isSheet={false}
                    />
                </div>
            )}
        </div>
      </div>
      
      <div className='md:hidden'>
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
    </div>
  );
}
