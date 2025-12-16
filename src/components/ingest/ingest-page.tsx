'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RawLog, ProcessedThreat, EnrichedEvent, UserBehaviorBaseline } from '@/lib/types';
import { faker } from '@faker-js/faker';
import { UploadCloud, FileJson, CheckCircle } from 'lucide-react';

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
    let riskExplanation = 'Standard operational event.';

    // Very basic parsing logic, this would be much more sophisticated
    const ipMatch = log.message.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    const ip = ipMatch ? ipMatch[0] : faker.internet.ip();
    const isNovelDevice = Math.random() < 0.1;
    const isNovelLocation = Math.random() < 0.1;
    let contextualScore = 0;
    if (isNovelDevice) contextualScore += 1;
    if (isNovelLocation) contextualScore += 2;

    if (log.event.includes('LOGIN_SUCCESS')) {
        eventType = 'Login Attempt';
        severity = 1 + contextualScore;
        riskExplanation = 'A user successfully logged into the system.';
        if (contextualScore > 0) riskExplanation += ' The login occurred from a new device or location.';
    } else if (log.event.includes('LOGIN_FAILED')) {
        eventType = 'Login Attempt';
        severity = 4 + contextualScore;
        riskExplanation = 'A failed login attempt was recorded.';
    } else if (log.event.includes('FILE_ACCESS')) {
        eventType = 'Resource Access';
        severity = 3;
        riskExplanation = `A user accessed a resource: ${log.message.split(' ').pop()}`;
    } else if (log.event.includes('API_CALL')) {
        eventType = 'API Call';
        severity = 2;
        riskExplanation = `An API call was made by user ${log.user}.`;
    } else if (log.event.includes('PRIVILEGE_ESCALATION')) {
        eventType = 'Privilege Escalation';
        severity = 9;
        userRole = faker.helpers.arrayElement(['Admin', 'Developer']);
        riskExplanation = 'A user attempted to escalate their system privileges.';
    } else if (log.event.includes('NETWORK_CONNECTION')) {
        eventType = 'Network Connection';
        severity = 2;
        riskExplanation = 'A network connection was established by the system.';
    }

    const userId = log.user || 'system';
    const behavioralBaseline = getOrCreateBaseline(userId);

    return {
        id,
        rawLog: log,
        timestamp: log.timestamp,
        user: { id: userId, name: userId, role: userRole },
        device: { id: log.host, isNovel: isNovelDevice },
        location: { ip: ip, country: faker.location.country(), isNovel: isNovelLocation },
        event: { type: eventType, details: log.message },
        ruleBasedSeverity: severity,
        riskExplanation,
        behavioralBaseline,
    };
}


export function IngestPage() {
  const [logs, setLogs] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setLogs(content);
      };
      reader.readAsText(file);
    }
  };

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
        riskScore: event.ruleBasedSeverity * 10, // Initial score based on rules
        detailedExplanation: null,
        behavioralAnomalyScore: null,
        behavioralExplanation: null,
        riskBreakdown: null,
        isAnalyzed: false,
      }));
      
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
        description: 'Please ensure the uploaded file is in valid JSONL format.',
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Ingest & Process Logs</CardTitle>
          <CardDescription>
            Upload a log file in JSON Lines (.jsonl) format to begin analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-12 text-center">
            <UploadCloud className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
                {fileName ? "File ready for processing" : "Drag & drop a file or click to upload"}
            </p>
             <Button variant="outline" className="mt-4" asChild>
                <label htmlFor="log-upload">
                    Browse Files
                    <input id="log-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".jsonl" />
                </label>
            </Button>
            {fileName && (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileJson className="w-4 h-4 text-primary" />
                    <span>{fileName}</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
            )}
          </div>
          <Button onClick={handleProcess} disabled={isProcessing || !logs} className="w-full">
            {isProcessing ? 'Processing...' : 'Process Logs & View Dashboard'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
