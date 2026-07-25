'use client';

import { Label, Pie, PieChart } from 'recharts';
import {
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

interface RegisteredUsersProps {
  buyers?: number;
  sellers?: number;
}

const chartConfig = {
  users: {
    label: 'Users',
  },
  buyer: {
    label: 'Buyer',
    color: 'var(--chart-1)',
  },
  seller: {
    label: 'Seller',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export default function RegisteredUsers({
  buyers = 0,
  sellers = 0,
}: RegisteredUsersProps) {
  const total = buyers + sellers;

  const chartData = [
    { type: 'buyer', users: buyers, fill: 'var(--color-buyer)' },
    { type: 'seller', users: sellers, fill: 'var(--color-seller)' },
  ];

  // When there's no data, show an empty ring
  const emptyData = [{ type: 'empty', users: 1, fill: 'hsl(var(--muted))' }];

  const displayData = total === 0 ? emptyData : chartData;

  return (
    <Card className='shadow-none bg-background'>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Registered Users
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[200px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={displayData}
              dataKey="users"
              nameKey="type"
              innerRadius={60}
              outerRadius={80}
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total.toLocaleString()}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex items-center gap-6 mt-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">Buyer</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-chart-2" />
            <span className="text-muted-foreground">Seller</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
