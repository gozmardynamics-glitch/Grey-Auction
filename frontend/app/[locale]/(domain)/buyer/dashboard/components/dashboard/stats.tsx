import { Clock, Megaphone, TrendingDown, Trophy } from 'lucide-react';

import { Card, CardContent } from '@/shared/components/common';

const stats = [
  {
    label: 'Active Bids',
    value: 6,
    icon: Megaphone,
    color: 'text-blue-600 bg-blue-100',
  },
  {
    label: 'Winning',
    value: 4,
    icon: Trophy,
    color: 'text-green-600 bg-tertiary/10',
  },
  {
    label: 'Outbid',
    value: 1,
    icon: TrendingDown,
    color: 'text-red-600 bg-red-100',
  },
  {
    label: 'Ending Soon',
    value: 1,
    icon: Clock,
    color: 'text-orange-600 bg-orange-100',
  },
];

export default function BuyerStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="shadow-none border">
            <CardContent className="flex flex-col gap-2 p-3">
              <div className={`flex items-center gap-2`}>
                <div
                  className={`flex h-8 w-8 rounded-lg p-1 items-center justify-center ${stat.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <div>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
