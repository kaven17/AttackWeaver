'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RawLog, ProcessedThreat, EnrichedEvent } from '@/lib/types';
import { faker } from '@faker-js/faker';

function parseAndEnrich(log: RawLog): EnrichedEvent {
    const id = faker.string.uuid();
    let eventType: EnrichedEvent['event']['type'] = 'Unknown';
    let severity = 1;

    // Very basic parsing logic, this would be much more sophisticated
    if (log.event.includes('LOGIN_SUCCESS')) {
        eventType = 'Login Attempt';
        severity = 1;
    } else if (log.event.includes('LOGIN_FAILED')) {
        eventType = 'Login Attempt';
        severity = 4;
    } else if (log.event.includes('FILE_ACCESS')) {
        eventType = 'Resource Access';
        severity = 3;
    } else if (log.event.includes('API_CALL')) {
        eventType = 'API Call';
        severity = 2;
    } else if (log.event.includes('PRIVILEGE_ESCALATION')) {
        eventType = 'Privilege Escalation';
        severity = 9;
    } else if (log.event.includes('NETWORK_CONNECTION')) {
        eventType = 'Network Connection';
        severity = 2;
    }

    const ipMatch = log.message.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);

    return {
        id,
        rawLog: log,
        timestamp: log.timestamp,
        user: {
            id: log.user || 'N/A',
            name: log.user || 'system',
        },
        device: {
            id: log.host,
            isNovel: Math.random() < 0.1, // 10% chance of being novel
        },
        location: {
            ip: ipMatch ? ipMatch[0] : 'N/A',
            country: faker.location.country(),
            isNovel: Math.random() < 0.1,
        },
        event: {
            type: eventType,
            details: log.message,
        },
        ruleBasedSeverity: severity,
    };
}


export function IngestPage({ defaultLogs }: { defaultLogs: string }) {
  const [logs, setLogs] = useState(defaultLogs);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleProcess = () => {
    setIsProcessing(true);
    try {
      const logLines = logs.trim().split('\n');
      const parsedLogs: RawLog[] = logLines.map(line => JSON.parse(line));
      
      const enrichedEvents = parsedLogs.map(parseAndEnrich);
      
      const initialThreats: ProcessedThreat[] = enrichedEvents.map(event => ({
        ...event,
        riskScore: null,
        riskExplanation: null,
        detailedExplanation: null,
        behavioralAnomalyScore: null,
        behavioralExplanation: null,
        riskBreakdown: null,
        isAnalyzed: false,
      }));
      
      // Sort by severity before storing
      initialThreats.sort((a, b) => b.ruleBasedSeverity - a.ruleBasedSeverity);

      localStorage.setItem('processedThreats', JSON.stringify(initialThreats));

      toast({
        title: 'Processing Complete',
        description: `${initialThreats.length} logs processed and sent to the dashboard.`,
      });

      router.push('/');

    } catch (error) {
      console.error("Failed to parse logs:", error);
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: 'Please ensure logs are in valid JSONL format.',
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Ingest & Process Logs</CardTitle>
          <CardDescription>
            Paste raw security logs in JSON Lines (.jsonl) format below. Each line should be a single JSON object.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={logs}
            onChange={(e) => setLogs(e.target.value)}
            className="h-96 font-code text-xs"
            placeholder='{ "timestamp": "...", "source": "...", ... }'
          />
          <Button onClick={handleProcess} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Process Logs'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
