'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ProcessedThreat, AnalyzeThreatOutput } from '@/lib/types';
import { OverviewCards } from './overview-cards';
import { ThreatList } from './threat-list';
import { ThreatDetailsSheet } from './threat-details-sheet';
import { Card } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { analyzeThreat } from '@/ai/flows/analyze-threat-flow';

type FeedbackAdjustment = {
  eventType: ProcessedThreat['event']['type'];
  adjustment: number;
};

// Store threats in a global scope to persist between navigations
let persistedThreats: ProcessedThreat[] = [];

export function DashboardPage({
  initialThreats,
}: {
  initialThreats: ProcessedThreat[];
}) {
  const [threats, setThreats] = useState<ProcessedThreat[]>(persistedThreats);
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null);
  const [feedbackAdjustments, setFeedbackAdjustments] = useState<
    FeedbackAdjustment[]
  >([]);
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const storedThreats = localStorage.getItem('processedThreats');
    if (storedThreats) {
      const parsedThreats = JSON.parse(storedThreats);
      setThreats(parsedThreats);
      persistedThreats = parsedThreats;
    } else if (initialThreats.length > 0) {
      setThreats(initialThreats);
      persistedThreats = initialThreats;
    }
  }, [initialThreats]);

  const handleFeedback = useCallback(
    (threat: ProcessedThreat, isConfirmedThreat: boolean) => {
      const adjustmentValue = isConfirmedThreat ? 0.1 : -0.1;
      const adjustment: FeedbackAdjustment = {
        eventType: threat.event.type,
        adjustment: adjustmentValue,
      };

      setFeedbackAdjustments((prev) => [...prev, adjustment]);

      toast({
        title: 'Feedback Received',
        description: `Risk model updated. Applying a ${
          adjustmentValue > 0 ? '+' : ''
        }${(adjustmentValue * 100).toFixed(
          0
        )}% risk adjustment to all "${threat.event.type}" events.`,
      });
    },
    [toast]
  );

  const handleAnalyzeThreat = useCallback(
    async (threatId: string) => {
      const threatToAnalyze = threats.find((t) => t.id === threatId);
      if (!threatToAnalyze || threatToAnalyze.isAnalyzed) return;

      setIsAnalyzing(true);
      let analysisResult: AnalyzeThreatOutput;

      try {
        analysisResult = await analyzeThreat(threatToAnalyze);
      } catch (error) {
        console.error('Failed to analyze threat:', error);
        toast({
          variant: 'destructive',
          title: 'AI Analysis Failed',
          description:
            'Could not connect to ThreatLens AI. Displaying fallback analysis.',
        });
        
        // Create a fallback analysis object
        const contextualScore = (threatToAnalyze.device.isNovel || threatToAnalyze.location.isNovel) ? 20 : 0;
        const fallbackRiskScore = Math.min(100, threatToAnalyze.ruleBasedSeverity * 8 + contextualScore);
        
        analysisResult = {
          riskScore: fallbackRiskScore,
          explanation: `AI analysis failed. Score based on severity and context.`,
          detailedExplanation: `Could not connect to ThreatLens AI™ for detailed analysis. The event was a "${threatToAnalyze.event.type}" by user "${threatToAnalyze.user.name}" from ${threatToAnalyze.location.country}.`,
          behavioralAnomalyScore: null,
          behavioralExplanation: "Could not connect to AI for behavioral analysis.",
          riskBreakdown: {
            ruleBased: threatToAnalyze.ruleBasedSeverity * 10,
            contextual: contextualScore,
            behavioral: 0
          }
        };
      } finally {
        const updatedThreat: ProcessedThreat = {
          ...threatToAnalyze,
          ...analysisResult,
          isAnalyzed: true,
        };

        const updatedThreats = threats.map((t) =>
          t.id === threatId ? updatedThreat : t
        );
        setThreats(updatedThreats);
        persistedThreats = updatedThreats;
        localStorage.setItem('processedThreats', JSON.stringify(updatedThreats));
        setIsAnalyzing(false);
      }
    },
    [threats, toast]
  );

  const adjustedThreats = useMemo(() => {
    if (feedbackAdjustments.length === 0) {
      return threats;
    }

    const adjustmentsByType = feedbackAdjustments.reduce(
      (acc, curr) => {
        acc[curr.eventType] = (acc[curr.eventType] || 0) + curr.adjustment;
        return acc;
      },
      {} as Record<string, number>
    );

    const newThreats = threats.map((threat) => {
      const adjustment = adjustmentsByType[threat.event.type] || 0;
      if (adjustment !== 0 && threat.riskScore) {
        const newRiskScore = threat.riskScore * (1 + adjustment);
        return {
          ...threat,
          riskScore: Math.min(100, Math.max(0, newRiskScore)),
        };
      }
      return threat;
    });

    newThreats.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
    return newThreats;
  }, [threats, feedbackAdjustments]);

  const selectedThreat = useMemo(
    () => adjustedThreats.find((t) => t.id === selectedThreatId) || null,
    [adjustedThreats, selectedThreatId]
  );

  const highRiskCount = adjustedThreats.filter(
    (t) => (t.riskScore || 0) >= 70
  ).length;
  const mediumRiskCount = adjustedThreats.filter(
    (t) => (t.riskScore || 0) >= 40 && (t.riskScore || 0) < 70
  ).length;

  if (adjustedThreats.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-2xl font-semibold">No Security Events</h2>
        <p className="text-muted-foreground mt-2">
          Go to the 'Ingest Logs' page to process security data.
        </p>
      </div>
    );
  }

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

      <div className="flex-1 space-y-6 p-4 sm:p-6 pt-0">
        <OverviewCards
          totalThreats={adjustedThreats.length}
          highRiskCount={highRiskCount}
          mediumRiskCount={mediumRiskCount}
        />
        <Card>
          <ThreatList
            threats={adjustedThreats}
            onSelectThreat={(threat) => setSelectedThreatId(threat.id)}
            selectedThreatId={selectedThreatId}
          />
        </Card>
      </div>

      <ThreatDetailsSheet
        threat={selectedThreat}
        onFeedback={handleFeedback}
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
