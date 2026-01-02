'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ProcessedThreat } from '@/lib/types';
import { OverviewCards } from './overview-cards';
import { ThreatList } from './threat-list';
import { ThreatDetailsSheet } from './threat-details-sheet';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { UploadCloud, ShieldHalf } from 'lucide-react';
import Link from 'next/link';

export function DashboardPage() {
  const [threats, setThreats] = useState<ProcessedThreat[]>([]);
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null);

  useEffect(() => {
    const storedThreats = localStorage.getItem('processedThreats');
    if (storedThreats) {
      const parsedThreats: ProcessedThreat[] = JSON.parse(storedThreats);
      const sortedThreats = parsedThreats
        .map(t => ({ ...t, riskScore: t.riskScore ?? t.ruleBasedSeverity * 10 }))
        .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
      setThreats(sortedThreats);
    }
  }, []);

  const selectedThreat = useMemo(
    () => threats.find(t => t.id === selectedThreatId) || null,
    [threats, selectedThreatId]
  );

  const lowRiskCount = threats.filter(t => (t.riskScore ?? 0) < 40).length;
  const mediumRiskCount = threats.filter(t => (t.riskScore ?? 0) >= 40 && (t.riskScore ?? 0) < 70).length;
  const highRiskCount = threats.filter(t => (t.riskScore ?? 0) >= 70).length;

  if (threats.length === 0) {
    return (
      <>
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
        <Footer />
      </>
    );
  }

  return (
    <>
      <div id="dashboard" className="flex flex-1 flex-col @container/dashboard py-8 md:py-12 lg:py-16 gap-6">
        <header>
          <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Threat Intelligence Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Prioritized security events based on rule-based and AI-analyzed risk scores. Click an event to view details.
          </p>
        </header>

        <OverviewCards
          totalThreats={threats.length}
          highRiskCount={highRiskCount}
          mediumRiskCount={mediumRiskCount}
        />

        <Card className="flex-1">
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
      <Footer />
    </>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldHalf className="h-5 w-5 text-primary" />
            <span className="font-bold">ThreatX</span>
            <span className="text-muted-foreground text-sm">
              © {currentYear} All rights reserved.
            </span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}