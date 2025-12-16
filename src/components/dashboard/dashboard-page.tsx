'use client';

import { useState } from 'react';
import type { ProcessedThreat } from '@/lib/types';
import { OverviewCards } from './overview-cards';
import { ThreatList } from './threat-list';
import { ThreatDetailsSheet } from './threat-details-sheet';
import { ThreatDistributionChart } from './threat-distribution-chart';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

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

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_450px] gap-6 p-4 sm:p-6 pt-0">
        <div className="flex flex-col gap-6">
          <OverviewCards
            totalThreats={threats.length}
            highRiskCount={highRiskCount}
            mediumRiskCount={mediumRiskCount}
          />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className='xl:col-span-2'>
              <ThreatList
                threats={threats}
                onSelectThreat={setSelectedThreat}
                selectedThreatId={selectedThreat?.id}
              />
            </Card>
            <Card className="hidden md:block xl:hidden">
              <ThreatDistributionChart
                  lowRiskCount={lowRiskCount}
                  mediumRiskCount={mediumRiskCount}
                  highRiskCount={highRiskCount}
              />
            </Card>
            {selectedThreat && (
                <div className='md:hidden xl:block xl:col-span-2'>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedThreat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
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
                    </motion.div>
                  </AnimatePresence>
                </div>
            )}
          </div>
        </div>
        <div className="hidden md:flex flex-col gap-6 xl:hidden">
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

        {/* Persistent Details Panel on xl+ screens */}
        <div className="hidden xl:flex flex-col gap-6">
            <Card>
                <ThreatDistributionChart
                    lowRiskCount={lowRiskCount}
                    mediumRiskCount={mediumRiskCount}
                    highRiskCount={highRiskCount}
                />
            </Card>
            <AnimatePresence mode="wait">
              {selectedThreat && (
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
                          open={!!selectedThreat}
                          onOpenChange={open => {
                          if (!open) {
                              setSelectedThreat(null);
                          }
                          }}
                          isSheet={false}
                      />
                  </motion.div>
              )}
            </AnimatePresence>
            {!selectedThreat && (
              <Card className='flex-1 flex items-center justify-center'>
                <p className='text-muted-foreground'>Select an event to see details</p>
              </Card>
            )}
        </div>
      </div>
      
      {/* Mobile Sheet */}
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