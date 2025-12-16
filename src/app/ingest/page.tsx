import { IngestPage } from '@/components/ingest/ingest-page';
import { promises as fs } from 'fs';
import path from 'path';

export default async function Ingest() {
  // Read logs from the new JSON file instead of generating them
  // This makes the data source consistent and inspectable.
  const logFilePath = path.join(process.cwd(), 'public', 'data', 'logs.jsonl');
  let rawLogsString = '';
  try {
    rawLogsString = await fs.readFile(logFilePath, 'utf8');
  } catch (error) {
    console.error('Could not read default logs file:', error);
    // Continue with an empty string, the client will fetch or show an empty state.
  }

  return <IngestPage defaultLogs={rawLogsString} />;
}
