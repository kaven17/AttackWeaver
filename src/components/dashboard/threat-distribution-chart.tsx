'use client';

import { BarChart, Bar, XAxis, YAxis,Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

type ThreatDistributionChartProps = {
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
};

type ChartDataItem = {
  level: string;
  count: number;
  fill: string;
};

const chartConfig = {
  count: { label: 'Count' },
  low: { label: 'Low', color: 'var(--color-low)' },
  medium: { label: 'Medium', color: 'var(--color-medium)' },
  high: { label: 'High', color: 'var(--color-high)' },
} as const;


export function ThreatDistributionChart({
  lowRiskCount,
  mediumRiskCount,
  highRiskCount,
}: ThreatDistributionChartProps) {
  // Prepare data for the chart
  const chartData: ChartDataItem[] = [
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
      <ChartContainer className="h-44 w-full" config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="level"
                type="category"
                axisLine={false}
                tickLine={false}
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
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="count"
                radius={4}
                isAnimationActive={true}
                fillOpacity={0.9}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.level} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </>
  );
}
