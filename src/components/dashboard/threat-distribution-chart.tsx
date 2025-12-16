'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';

type ThreatDistributionChartProps = {
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
};

const chartConfig = {
  count: {
    label: 'Count',
  },
  low: {
    label: 'Low',
    color: 'hsl(var(--risk-low))',
  },
  medium: {
    label: 'Medium',
    color: 'hsl(var(--risk-medium))',
  },
  high: {
    label: 'High',
    color: 'hsl(var(--risk-high))',
  },
} satisfies ChartConfig;

export function ThreatDistributionChart({
  lowRiskCount,
  mediumRiskCount,
  highRiskCount,
}: ThreatDistributionChartProps) {
  const chartData = [
    { level: 'High', count: highRiskCount, fill: 'var(--color-high)' },
    { level: 'Medium', count: mediumRiskCount, fill: 'var(--color-medium)' },
    { level: 'Low', count: lowRiskCount, fill: 'var(--color-low)' },
  ];

  return (
    <>
      <CardHeader>
        <CardTitle>Threat Distribution</CardTitle>
        <CardDescription>Breakdown by risk level</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-40 w-full">
          <ResponsiveContainer>
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="level"
                type="category"
                tickLine={false}
                axisLine={false}
                tick={({ x, y, payload }) => (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={4}
                      textAnchor="start"
                      fill="hsl(var(--muted-foreground))"
                      fontSize={12}
                    >
                      {payload.value}
                    </text>
                  </g>
                )}
                className='translate-x-2'
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="count" layout="vertical" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </>
  );
}
