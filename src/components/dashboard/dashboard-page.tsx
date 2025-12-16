'use client';

import { useState, useMemo, useCallback } from 'react';
import type { ProcessedThreat } from '@/lib/types';
import { OverviewCards } from './overview-cards';
import { ThreatList } from './threat-list';
import { ThreatDetailsSheet } from './threat-details-sheet';
import { ThreatDistributionChart } from './threat-distribution-chart';
import { Card } from '../ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

type FeedbackAdjustment = {
  eventType: ProcessedThreat['event']['type'];
  adjustment: number;
};

export function DashboardPage({ threats: initialThreats }: { threats: ProcessedThreat[] }) {
  const [threats, setThreats] = useState<ProcessedThreat[]>(initialThreats);
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(
    initialThreats[0]?.id || null
  );
  const [feedbackAdjustments, setFeedbackAdjustments] = useState<FeedbackAdjustment[]>([]);
  const { toast } = useToast();

  const handleFeedback = useCallback((threat: ProcessedThreat, isConfirmedThreat: boolean) => {
    const adjustmentValue = isConfirmedThreat ? 0.1 : -0.1;
    const adjustment: FeedbackAdjustment = {
      eventType: threat.event.type,
      adjustment: adjustmentValue,
    };
    
    setFeedbackAdjustments(prev => [...prev, adjustment]);

    toast({
        title: "Feedback Received",
        description: `Risk model updated. Applying a ${adjustmentValue > 0 ? '+' : ''}${(adjustmentValue * 100).toFixed(0)}% risk adjustment to all "${threat.event.type}" events.`
    });

  }, [toast]);

  const adjustedThreats = useMemo(() => {
    if (feedbackAdjustments.length === 0) {
      return threats;
    }

    const adjustmentsByType = feedbackAdjustments.reduce((acc, curr) => {
        acc[curr.eventType] = (acc[curr.eventType] || 0) + curr.adjustment;
        return acc;
    }, {} as Record<string, number>);

    const newThreats = threats.map(threat => {
      const adjustment = adjustmentsByType[threat.event.type] || 0;
      if (adjustment !== 0) {
        const newRiskScore = threat.riskScore * (1 + adjustment);
        return {
          ...threat,
          riskScore: Math.min(100, Math.max(0, newRiskScore)),
          riskExplanation: `(Adjusted after feedback) ${threat.riskExplanation}`,
        };
      }
      return threat;
    });

    newThreats.sort((a,b) => b.riskScore - a.riskScore);
    return newThreats;

  }, [threats, feedbackAdjustments]);

  const selectedThreat = useMemo(
      () => adjustedThreats.find(t => t.id === selectedThreatId) || null,
      [adjustedThreats, selectedThreatId]
  );

  const highRiskCount = adjustedThreats.filter(t => t.riskScore >= 70).length;
  const mediumRiskCount = adjustedThreats.filter(
    t => t.riskScore >= 40 && t.riskScore < 70
  ).length;
  const lowRiskCount = adjustedThreats.filter(t => t.riskScore < 40).length;

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

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_450px] gap-6 p-4 sm:p-6 pt-0">
        <div className="flex flex-col gap-6">
          <OverviewCards
            totalThreats={adjustedThreats.length}
            highRiskCount={highRiskCount}
            mediumRiskCount={mediumRiskCount}
          />
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <ThreatList
                threats={adjustedThreats}
                onSelectThreat={(threat) => setSelectedThreatId(threat.id)}
                selectedThreatId={selectedThreatId}
              />
            </Card>
          </div>
        </div>
        
        <div className="hidden xl:flex flex-col gap-6">
            <Card>
                <ThreatDistributionChart
                    lowRiskCount={lowRiskCount}
                    mediumRiskCount={mediumRiskCount}
                    highRiskCount={highRiskCount}
                />
            </Card>
            <AnimatePresence mode="wait">
              {selectedThreat ? (
                  <motion.div
                    key={selectedThreat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1"
                  >
                      <ThreatDetailsSheet
                          threat={selectedThreat}
                          onFeedback={handleFeedback}
                          open={!!selectedThreat}
                          onOpenChange={open => {
                            if (!open) setSelectedThreatId(null);
                          }}
                          isSheet={false}
                      />
                  </motion.div>
              ) : (
                <Card className='flex-1 flex items-center justify-center'>
                    <p className='text-muted-foreground'>Select an event to see details</p>
                </Card>
              )}
            </AnimatePresence>
        </div>
      </div>
      
      {/* Mobile/Tablet Sheet */}
      <div className='xl:hidden'>
        <ThreatDetailsSheet
            threat={selectedThreat}
            onFeedback={handleFeedback}
            open={!!selectedThreat}
            onOpenChange={open => {
                if (!open) setSelectedThreatId(null);
            }}
        />
      </div>
    </div>
  );
}
