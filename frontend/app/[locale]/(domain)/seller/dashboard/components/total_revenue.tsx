'use client';

import { useState } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/common';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/components/common/chart';

type TimeFilter = '12 months' | '3 months' | '7 days';

interface RevenueDataPoint {
  month: string;
  sales: number;
  expense: number;
}

interface TotalRevenueProps {
  data?: RevenueDataPoint[];
  totalRevenue?: number;
  percentageChange?: number;
}

const defaultData: RevenueDataPoint[] = [
  { month: 'Jan', sales: 5_000_000, expense: 3_200_000 },
  { month: 'Feb', sales: 8_500_000, expense: 4_100_000 },
  { month: 'Mar', sales: 12_000_000, expense: 6_800_000 },
  { month: 'Apr', sales: 7_200_000, expense: 5_500_000 },
  { month: 'May', sales: 15_000_000, expense: 9_000_000 },
  { month: 'Jun', sales: 22_000_000, expense: 11_500_000 },
  { month: 'Jul', sales: 18_000_000, expense: 10_200_000 },
  { month: 'Aug', sales: 25_000_000, expense: 13_000_000 },
  { month: 'Sep', sales: 20_000_000, expense: 12_400_000 },
  { month: 'Oct', sales: 28_000_000, expense: 15_000_000 },
  { month: 'Nov', sales: 24_000_000, expense: 14_200_000 },
  { month: 'Dec', sales: 30_000_000, expense: 16_500_000 },
];

const chartConfig = {
  sales: {
    label: 'Sales',
    color: 'var(--chart-1)',
  },
  expense: {
    label: 'Expense',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const timeFilters: TimeFilter[] = ['12 months', '3 months', '7 days'];

export default function TotalRevenue({
  data = defaultData,
  totalRevenue = 0,
  percentageChange = 0,
}: TotalRevenueProps) {
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('12 months');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatYAxis = (value: number) => {
    if (value >= 1_000_000) return `${value / 1_000_000}M`;
    if (value >= 1_000) return `${value / 1_000}K`;
    return value.toString();
  };

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">Total Revenue</CardTitle>
          <div className="text-3xl font-bold">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-sm text-muted-foreground">
            ({percentageChange}%) from last month
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-background p-1">
          {timeFilters.map((filter) => (
            <Button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              variant={activeFilter === filter ? 'default' : 'ghost'}
              className={`rounded-xl px-3 py-1 text-xs font-medium transition-colors  ${
                activeFilter === filter
                  ? 'bg-card text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4 justify-end">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">Sales</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-chart-2" />
            <span className="text-muted-foreground">Expense</span>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-foreground">
          <LineChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(value as number)}
                />
              }
            />
            <Line
              dataKey="sales"
              stroke="var(--color-sales)"
              strokeWidth={2}
              dot={false}
              type="monotone"
            />
            <Line
              dataKey="expense"
              stroke="var(--color-expense)"
              strokeWidth={2}
              dot={false}
              type="monotone"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
