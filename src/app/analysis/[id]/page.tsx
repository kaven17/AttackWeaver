'use client';
import { useState, useEffect } from 'react';
import { ProcessedThreat, AnalyzeThreatOutput } from '@/lib/types';
import { analyzeThreat } from '@/ai/flows/analyze-threat-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Zap, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { RiskScoreBadge } from '@/components/dashboard/risk-score-badge';

export default function AnalysisPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [threat, setThreat] = useState<ProcessedThreat | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeThreatOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedThreats = localStorage.getItem('processedThreats');
    if (storedThreats) {
      const parsedThreats: ProcessedThreat[] = JSON.parse(storedThreats);
      const foundThreat = parsedThreats.find(t => t.id === id);
      if (foundThreat) {
        setThreat(foundThreat);
        // If analysis was already stored, use it
        if (foundThreat.isAnalyzed) {
            setAnalysisResult({
                riskScore: foundThreat.riskScore || 0,
                detailedExplanation: foundThreat.detailedExplanation || "",
                behavioralAnomalyScore: foundThreat.behavioralAnomalyScore || 0,
                riskBreakdown: foundThreat.riskBreakdown || {ruleBased: 0, contextual: 0, behavioral: 0},
            })
        }
      }
    }
    setIsLoading(false);
  }, [id]);

  const handleAnalyze = async () => {
    if (!threat) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeThreat(threat);
      setAnalysisResult(result);

      // Update the threat in localStorage with the new analysis
      const storedThreats = localStorage.getItem('processedThreats');
      if (storedThreats) {
        let parsedThreats: ProcessedThreat[] = JSON.parse(storedThreats);
        parsedThreats = parsedThreats.map(t =>
          t.id === id
            ? { ...t, ...result, isAnalyzed: true, riskScore: result.riskScore }
            : t
        );
        localStorage.setItem('processedThreats', JSON.stringify(parsedThreats));
      }
      toast({
        title: "AI Analysis Complete",
        description: "The threat has been successfully analyzed."
      })

    } catch (error) {
      console.error("AI Analysis failed:", error);
      toast({
        variant: 'destructive',
        title: "AI Analysis Failed",
        description: "Could not get a response from the AI. Please check your API key and network."
      })
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-8"><Skeleton className="h-96 w-full" /></div>;
  }

  if (!threat) {
    return <div className="container mx-auto p-8 text-center text-red-500">Threat not found.</div>;
  }

  const displayRiskScore = analysisResult ? analysisResult.riskScore : threat.riskScore;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <RiskScoreBadge score={displayRiskScore} />
                <CardTitle className="text-2xl">{threat.event.type}</CardTitle>
              </div>
              <CardDescription className="text-base pt-2">{threat.riskExplanation}</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded-md text-xs font-code overflow-x-auto">
                {JSON.stringify(threat.rawLog, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot /> ThreatLens AI™ Analysis
              </CardTitle>
              <CardDescription>
                Use generative AI to get a deeper analysis of this event.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analysisResult ? (
                <div className='text-center'>
                    <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                      {isAnalyzing ? (
                        <>
                          <Zap className="mr-2 h-4 w-4 animate-pulse" />
                          Analyzing...
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
                  <div>
                    <h4 className="font-semibold mb-2">AI Explanation</h4>
                    <p className="text-sm text-muted-foreground bg-background p-3 rounded-md border">
                        {analysisResult.detailedExplanation}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Risk Breakdown</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold">{analysisResult.riskBreakdown.ruleBased}</div>
                            <div className="text-xs text-muted-foreground">Rule-Based</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{analysisResult.riskBreakdown.contextual}</div>
                            <div className="text-xs text-muted-foreground">Contextual</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{analysisResult.riskBreakdown.behavioral}</div>
                            <div className="text-xs text-muted-foreground">Behavioral</div>
                        </div>
                    </div>
                  </div>
                   <div>
                    <h4 className="font-semibold mb-2">Behavioral Anomaly Score</h4>
                    <p className="text-2xl font-bold font-mono text-center p-2 bg-background rounded-md border">
                        {analysisResult.behavioralAnomalyScore.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
