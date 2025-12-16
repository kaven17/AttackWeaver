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

function generateStaticAnalysis(threat: ProcessedThreat): AnalyzeThreatOutput {
  const { ruleBasedSeverity, device, location } = threat;
  
  let contextualScore = (device.isNovel ? 20 : 0) + (location.isNovel ? 15 : 0);
  if (threat.event.type === 'Privilege Escalation') contextualScore += 10;

  const finalScore = Math.min(95, (ruleBasedSeverity * 10) + contextualScore);
  
  let explanation = `This is a **${threat.event.type}** event by user **${threat.user.name}**. `;
  explanation += `The initial rule-based severity was ${ruleBasedSeverity}/10. `;
  
  const contextFlags = [];
  if (device.isNovel) contextFlags.push("a novel device");
  if (location.isNovel) contextFlags.push("a new location");
  if (contextFlags.length > 0) {
    explanation += `The risk score was increased due to context flags: ${contextFlags.join(' and ')}. `;
  }
  explanation += "This static analysis provides a preliminary assessment. For a deeper, AI-powered analysis of behavioral patterns and event correlation, run the full ThreatLens AI."

  return {
    riskScore: finalScore,
    detailedExplanation: explanation,
    behavioralAnomalyScore: 0,
    riskBreakdown: {
      ruleBased: ruleBasedSeverity * 10,
      contextual: contextualScore,
      behavioral: 0,
    },
  };
}


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
      const threatsWithScores = parsedThreats.map(t => ({
        ...t,
        riskScore: t.isAnalyzed ? t.riskScore : t.ruleBasedSeverity * 10,
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
        ).sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
        
        setThreats(updatedThreats);
        localStorage.setItem('processedThreats', JSON.stringify(updatedThreats));
        
        toast({
          title: 'AI Analysis Complete',
          description: `Enhanced risk assessment for event ${threatId}.`
        });

      } catch (error) {
        console.error('Failed to analyze threat:', error);
        
        // AI failed, so we generate a static analysis as a fallback
        const staticAnalysis = generateStaticAnalysis(threatToAnalyze);
        const updatedThreat: ProcessedThreat = {
          ...threatToAnalyze,
          ...staticAnalysis,
          isAnalyzed: true, // Mark as analyzed to show the static data
          detailedExplanation: `[AI UNAVAILABLE] ${staticAnalysis.detailedExplanation}`
        };

        const updatedThreats = threats.map((t) =>
          t.id === threatId ? updatedThreat : t
        ).sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));

        setThreats(updatedThreats);
        localStorage.setItem('processedThreats', JSON.stringify(updatedThreats));

        toast({
          variant: 'destructive',
          title: 'AI Analysis Failed',
          description:
            'Displaying static analysis instead. Check your API key or network.',
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
