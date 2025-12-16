import { DashboardPage } from '@/components/dashboard/dashboard-page';

export default async function Home() {
  // The main dashboard now receives an empty array, as data will be handled
  // on the client-side after being processed from the new /ingest page.
  return <DashboardPage initialThreats={[]} />;
}
