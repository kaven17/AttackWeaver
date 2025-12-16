import { IngestPage } from '@/components/ingest/ingest-page';
import { generateRawLogs } from '@/lib/mock-data';

export default function Ingest() {
  const rawLogs = generateRawLogs(15);
  const rawLogsString = rawLogs.map(log => JSON.stringify(log)).join('\n');

  return <IngestPage defaultLogs={rawLogsString} />;
}
