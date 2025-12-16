import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  ShieldHalf,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type OverviewCardsProps = {
  totalThreats: number;
  highRiskCount: number;
  mediumRiskCount: number;
};

export function OverviewCards({
  totalThreats,
  highRiskCount,
  mediumRiskCount,
}: OverviewCardsProps) {
  const stats = [
    {
      title: 'Total Events',
      value: totalThreats,
      icon: Activity,
      color: 'text-primary',
    },
    {
      title: 'High-Risk Alerts',
      value: highRiskCount,
      icon: ShieldAlert,
      color: 'text-risk-high',
    },
    {
      title: 'Medium-Risk Alerts',
      value: mediumRiskCount,
      icon: ShieldHalf,
      color: 'text-risk-medium',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map(stat => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              in the last 7 days
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
