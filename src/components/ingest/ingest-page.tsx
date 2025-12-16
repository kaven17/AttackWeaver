'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RawLog, ProcessedThreat, EnrichedEvent, UserBehaviorBaseline } from '@/lib/types';
import { faker } from '@faker-js/faker';

const userBaselines: Record<string, UserBehaviorBaseline> = {};

function getOrCreateBaseline(userId: string): UserBehaviorBaseline {
    if (!userBaselines[userId]) {
        userBaselines[userId] = {
            loginTime: { normalRange: [faker.number.int({ min: 7, max: 9 }), faker.number.int({ min: 17, max: 19 })] },
            resourceAccess: { typicalOrder: ['/dashboard', '/reports', '/settings'] },
            apiCallFrequency: { mean: faker.number.int({ min: 10, max: 50 }), stdDev: faker.number.int({ min: 2, max: 8 }) }
        };
    }
    return userBaselines[userId];
}


function parseAndEnrich(log: RawLog): EnrichedEvent {
    const id = faker.string.uuid();
    let eventType: EnrichedEvent['event']['type'] = 'Unknown';
    let severity = 1;
    let userRole = 'User';

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
        userRole = faker.helpers.arrayElement(['Admin', 'Developer']);
    } else if (log.event.includes('NETWORK_CONNECTION')) {
        eventType = 'Network Connection';
        severity = 2;
    }

    const ipMatch = log.message.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    const userId = log.user || 'system';
    const behavioralBaseline = getOrCreateBaseline(userId);

    return {
        id,
        rawLog: log,
        timestamp: log.timestamp,
        user: {
            id: userId,
            name: userId,
            role: userRole,
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
        behavioralBaseline,
    };
}


export function IngestPage({ defaultLogs }: { defaultLogs: string }) {
  const [logs, setLogs] = useState(defaultLogs);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // On mount, if defaultLogs is empty, try to fetch from the new file.
    if (!defaultLogs) {
      fetch('/data/logs.jsonl')
        .then(response => response.text())
        .then(text => {
          setLogs(text);
        })
        .catch(err => {
          console.error("Could not load default logs:", err);
        });
    }
  }, [defaultLogs]);


  const handleProcess = () => {
    setIsProcessing(true);
    try {
      const logLines = logs.trim().split('\n');
      const parsedLogs: RawLog[] = logLines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.error('Failed to parse line:', line);
          return null;
        }
      }).filter((log): log is RawLog => log !== null);
      
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
            Paste raw security logs in JSON Lines (.jsonl) format below, or use the pre-loaded sample data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={logs}
            onChange={(e) => setLogs(e.target.value)}
            className="h-96 font-code text-xs"
            placeholder='{ "timestamp": "...", "source": "...", ... }'
          />
          <Button onClick={handleProcess} disabled={isProcessing || !logs}>
            {isProcessing ? 'Processing...' : 'Process Logs'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
