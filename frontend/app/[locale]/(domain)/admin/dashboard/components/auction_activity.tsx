
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

interface AuctionActivityProps {
  active?: number;
  pending?: number;
  cancelled?: number;
  completed?: number;
}

const chartConfig = {
  auctions: {
    label: 'Auctions',
  },
  active: {
    label: 'Active',
    color: 'var(--chart-1)',
  },
  pending: {
    label: 'Pending',
    color: 'var(--chart-3)',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'var(--chart-4)',
  },
  completed: {
    label: 'Completed',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

export default function AuctionActivity({
  active = 0,
  pending = 0,
  cancelled = 0,
  completed = 0,
}: AuctionActivityProps) {
  const total = active + pending + cancelled + completed;

  const chartData = [
    { status: 'active', auctions: active, fill: 'var(--color-active)' },
    { status: 'pending', auctions: pending, fill: 'var(--color-pending)' },
    {
      status: 'cancelled',
      auctions: cancelled,
      fill: 'var(--color-cancelled)',
    },
    {
      status: 'completed',
      auctions: completed,
      fill: 'var(--color-completed)',
    },
  ];

  const emptyData = [
    { status: 'empty', auctions: 1, fill: 'hsl(var(--muted))' },
  ];

  const displayData = total === 0 ? emptyData : chartData;

  const stats = [
    { label: 'Active', value: active, color: 'var(--chart-1)' },
    { label: 'Pending', value: pending, color: 'var(--chart-3)' },
    { label: 'Cancelled', value: cancelled, color: 'var(--chart-4)' },
    { label: 'Completed', value: completed, color: 'var(--chart-5)' },
  ];

  return (
    <Card className='shadow-none bg-background'>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Auction Activity
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
              dataKey="auctions"
              nameKey="status"
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
                          {total}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground ml-auto">
                {value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
