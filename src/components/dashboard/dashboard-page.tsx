'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ProcessedThreat, AnalyzeThreatOutput } from '@/lib/types';
import { OverviewCards } from './overview-cards';
import { ThreatList } from './threat-list';
import { ThreatDetailsSheet } from './threat-details-sheet';
import { Card } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { analyzeThreat } from '@/ai/flows/analyze-threat-flow';
import { Button } from '../ui/button';
import { UploadCloud } from 'lucide-react';
import Link from 'next/link';

export function DashboardPage({
  initialThreats,
}: {
  initialThreats: ProcessedThreat[];
}) {
  const [threats, setThreats] = useState<ProcessedThreat[]>(initialThreats);
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const storedThreats = localStorage.getItem('processedThreats');
    if (storedThreats) {
      const parsedThreats: ProcessedThreat[] = JSON.parse(storedThreats);
      // Recalculate scores on load to ensure consistency
      const threatsWithScores = parsedThreats.map(t => ({
        ...t,
        riskScore: t.riskScore ?? t.ruleBasedSeverity * 10,
      })).sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
      setThreats(threatsWithScores);
    }
  }, []);

  const handleAnalyzeThreat = useCallback(
    async (threatId: string) => {
      const threatToAnalyze = threats.find((t) => t.id === threatId);
      if (!threatToAnalyze || threatToAnalyze.isAnalyzed) return;

      setIsAnalyzing(true);
      try {
        const analysisResult: AnalyzeThreatOutput = await analyzeThreat(threatToAnalyze);
        const updatedThreat: ProcessedThreat = {
          ...threatToAnalyze,
          ...analysisResult,
          isAnalyzed: true,
        };

        const updatedThreats = threats.map((t) =>
          t.id === threatId ? updatedThreat : t
        );
        setThreats(updatedThreats);
        localStorage.setItem('processedThreats', JSON.stringify(updatedThreats));

      } catch (error) {
        console.error('Failed to analyze threat:', error);
        toast({
          variant: 'destructive',
          title: 'AI Analysis Failed',
          description:
            'Could not connect to ThreatLens AI. Please check your API key and network connection.',
        });
      } finally {
        setIsAnalyzing(false);
      }
    },
    [threats, toast]
  );

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
      <div className="flex flex-1 flex-col items-center justify-center h-full p-8 text-center bg-background rounded-xl">
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
    <div className="flex flex-1 flex-col @container/dashboard p-4 md:p-6 lg:p-8 gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
          Threat Intelligence Dashboard
        </h1>
        <p className="text-muted-foreground">
          AI-powered analysis of security events. Click an event to analyze.
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
        onAnalyze={handleAnalyzeThreat}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
}
