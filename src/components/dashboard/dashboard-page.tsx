'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ProcessedThreat } from '@/lib/types';
import { OverviewCards } from './overview-cards';
import { ThreatList } from './threat-list';
import { ThreatDetailsSheet } from './threat-details-sheet';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { UploadCloud } from 'lucide-react';
import Link from 'next/link';


export function DashboardPage() {
  const [threats, setThreats] = useState<ProcessedThreat[]>([]);
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null);

  useEffect(() => {
    const storedThreats = localStorage.getItem('processedThreats');
    if (storedThreats) {
      const parsedThreats: ProcessedThreat[] = JSON.parse(storedThreats);
      const threatsWithScores = parsedThreats.map(t => ({
        ...t,
        riskScore: t.riskScore ?? t.ruleBasedSeverity * 10,
      })).sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
      setThreats(threatsWithScores);
    }
  }, []);

  const selectedThreat = useMemo(
    () => threats.find((t) => t.id === selectedThreatId) || null,
    [threats, selectedThreatId]
  );

  const highRiskCount = threats.filter(
    (t) => (t.riskScore || 0) >= 70
  ).length;
  const mediumRiskCount = threats.filter(
    (t) => (t.riskScore || 0) >= 40 && (t.riskScore || 0) < 70
  ).length;
  
  if (threats.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-full p-8 text-center bg-card rounded-xl my-10">
        <UploadCloud className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold mt-4">No Security Events</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          There are no security events to display. Please go to the 'Ingest Logs' page to upload and process your security data.
        </p>
        <Button asChild className="mt-6">
          <Link href="/ingest">
            <UploadCloud />
            <span>Ingest Logs</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div id="dashboard" className="flex flex-1 flex-col @container/dashboard py-8 md:py-12 lg:py-16 gap-6">
      <header>
        <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Threat Intelligence Dashboard
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Prioritized security events based on rule-based analysis. Click an event to view details.
        </p>
      </header>

      <OverviewCards
        totalThreats={threats.length}
        highRiskCount={highRiskCount}
        mediumRiskCount={mediumRiskCount}
      />
      
      <Card className='flex-1'>
        <ThreatList
          threats={threats}
          onSelectThreat={(threat) => setSelectedThreatId(threat.id)}
          selectedThreatId={selectedThreatId}
        />
      </Card>

      <ThreatDetailsSheet
        threat={selectedThreat}
        open={!!selectedThreat}
        onOpenChange={(open) => {
          if (!open) setSelectedThreatId(null);
        }}
      />
    </div>
  );
}
