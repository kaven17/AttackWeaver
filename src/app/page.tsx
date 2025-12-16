import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { Hero } from '@/components/layout/hero';

export default async function Home() {
  return (
    <>
      <Hero />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardPage initialThreats={[]} />
      </div>
    </>
  );
}
