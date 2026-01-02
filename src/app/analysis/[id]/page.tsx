'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, Zap, ArrowLeft } from 'lucide-react';

import { analyzeThreat } from '@/ai/actions/analyzethreat';
import { ProcessedThreat, AnalyzeThreatOutput, EnrichedEvent } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RiskScoreBadge } from '@/components/dashboard/risk-score-badge';
import { useToast } from '@/hooks/use-toast';

interface AnalysisPageProps {
  params: Promise<{ id: string }>;
}

export default function AnalysisPage({ params }: AnalysisPageProps) {
  const { id } = use(params);

  const [threat, setThreat] = useState<ProcessedThreat | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeThreatOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const { toast } = useToast();

  /* ======================================================
     LOAD THREAT FROM LOCAL STORAGE
  ====================================================== */
  useEffect(() => {
    console.log('[UI] Loading threat from localStorage');

    const raw = localStorage.getItem('processedThreats');
    if (!raw) {
      setLoading(false);
      return;
    }

    const threats: ProcessedThreat[] = JSON.parse(raw);
    const found = threats.find(t => t.id === id) ?? null;

    if (!found) {
      setLoading(false);
      return;
    }

    setThreat(found);

    if (found.isAnalyzed && found.riskScore !== null) {
      console.log('[UI] Threat already analyzed — restoring result');
      setAnalysis({
        riskScore: found.riskScore,
        detailedExplanation: found.detailedExplanation!,
        behavioralAnomalyScore: found.behavioralAnomalyScore ?? 0,
        riskBreakdown: found.riskBreakdown ?? {
          ruleBased: 0,
          contextual: 0,
          behavioral: 0,
        },
        attackStage: (found as any).attackStage ?? 'Unknown',
        confidence: (found as any).confidence ?? {
          confidenceScore: 0,
          confidenceExplanation: '',
        },
      });
    }

    setLoading(false);
  }, [id]);

  /* ======================================================
     RUN AI ANALYSIS
  ====================================================== */
  async function handleAnalyze() {
    if (!threat || threat.isAnalyzed) return;

    console.log('==============================');
    console.log('[UI] User triggered AI analysis');
    console.log('Threat ID:', threat.id);
    console.log('==============================');

    const enriched: EnrichedEvent = {
      id: threat.id,
      timestamp: threat.timestamp,
      rawLog: threat.rawLog,
      user: threat.user,
      device: threat.device,
      location: threat.location,
      event: threat.event,
      ruleBasedSeverity: threat.ruleBasedSeverity,
      riskExplanation: threat.riskExplanation,
      behavioralBaseline: threat.behavioralBaseline,
    };

    setAnalyzing(true);

    try {
      console.log('[UI] Calling analyzeThreat() API...');
      const result = await analyzeThreat(enriched);
      console.log('[UI] AI response received:', result);

      setAnalysis(result);

      const raw = localStorage.getItem('processedThreats');
      if (raw) {
        const updated = JSON.parse(raw).map((t: ProcessedThreat) =>
          t.id === id
            ? {
                ...t,
                isAnalyzed: true,
                riskScore: result.riskScore,
                detailedExplanation: result.detailedExplanation,
                behavioralAnomalyScore: result.behavioralAnomalyScore,
                riskBreakdown: result.riskBreakdown,
                attackStage: result.attackStage,
                confidence: result.confidence,
              }
            : t
        );
        localStorage.setItem('processedThreats', JSON.stringify(updated));
      }

      toast({
        title: 'AI Analysis Complete',
        description: 'Threat has been analyzed successfully.',
      });
    } catch (err) {
      console.error('[UI] AI Analysis failed:', err);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Unable to reach AI backend.',
      });
    } finally {
      setAnalyzing(false);
    }
  }

  /* ======================================================
     RENDER STATES
  ====================================================== */
  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!threat) {
    return <div className="text-center text-red-500">Threat not found</div>;
  }

  const riskScore = analysis?.riskScore ?? threat.riskScore ?? 0;

  /* ======================================================
     UI
  ====================================================== */
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button asChild variant="outline">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Threat Summary */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <RiskScoreBadge score={riskScore} />
                <CardTitle className="text-2xl">
                  {threat.event.type}
                </CardTitle>
              </div>
              <CardDescription className="pt-2">
                {threat.riskExplanation}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                {JSON.stringify(threat.rawLog, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot /> ThreatLens AI™ Analysis
              </CardTitle>
              <CardDescription>
                Live AI-driven threat reasoning
              </CardDescription>
            </CardHeader>

            <CardContent>
              {!analysis ? (
                <div className="text-center">
                  <Button onClick={handleAnalyze} disabled={analyzing}>
                    {analyzing ? (
                      <>
                        <Zap className="mr-2 h-4 w-4 animate-pulse" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Run Full Analysis
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Section title="AI Explanation">
                    {analysis.detailedExplanation}
                  </Section>

                  <Section title="Attack Stage">
                    {analysis.attackStage}
                  </Section>

                  <Section title="Risk Breakdown">
                    <div className="grid grid-cols-3 text-center">
                      <Metric label="Rule-Based" value={analysis.riskBreakdown.ruleBased} />
                      <Metric label="Contextual" value={analysis.riskBreakdown.contextual} />
                      <Metric label="Behavioral" value={analysis.riskBreakdown.behavioral} />
                    </div>
                  </Section>

                  <Section title="Behavioral Anomaly Score">
                    {analysis.behavioralAnomalyScore.toFixed(2)}
                  </Section>

                  <Section title="Confidence">
                    {analysis.confidence.confidenceScore} — {analysis.confidence.confidenceExplanation}
                  </Section>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   SMALL UI HELPERS
====================================================== */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="text-sm bg-background p-3 rounded-md border text-center">
        {children}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
