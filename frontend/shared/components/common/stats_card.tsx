import { LucideIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/common';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  iconColor?: string;
  iconBgColor?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend = 0,
  trendLabel = 'vs last month',
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="h-4 w-4" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <Card className="overflow-hidden  shadow-none">
      <CardHeader className="">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconBgColor}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-semibold text-foreground">{value}</div>
        <div className="flex items-center gap-1 text-sm">
          <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md bg-background text-foreground ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="font-medium">{Math.abs(trend)}%</span>
          </div>
          <span className="text-muted-foreground">{trendLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
