'use client';

import { Button } from '@/components/ui/button';
import { ShieldHalf } from 'lucide-react';

export function Hero() {
  const scrollToDashboard = () => {
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
      dashboard.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-screen w-full flex items-center justify-center bg-background text-foreground">
      {/* Background Grid */}
      <div className="absolute inset-0 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:72px_72px]"></div>
      
      {/* Radial Gradient */}
      <div className="absolute inset-0 h-full w-full bg-[radial-gradient(circle_at_center,rgba(16,128,62,0.3)_0%,transparent_40%)]"></div>

      <div className="relative z-10 flex flex-col items-center text-center p-4">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-lg">
            <ShieldHalf className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-foreground">
          ThreatLens-X
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl text-muted-foreground">
          An advanced, AI-powered threat intelligence platform that transforms raw security logs into actionable, explainable insights.
        </p>
        <Button onClick={scrollToDashboard} className="mt-8" size="lg">
          View Dashboard
        </Button>
      </div>
    </section>
  );
}
