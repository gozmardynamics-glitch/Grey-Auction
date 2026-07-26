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
    <Card className="overflow-hidden">
      <CardHeader className="pb-1">
        <div className="flex items-center gap-1.5">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-md ${iconBgColor}`}
          >
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-lg font-semibold text-foreground">{value}</div>
        <div className="flex items-center gap-1 text-[10px]">
          <div className={`flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded bg-background text-foreground ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="font-medium">{Math.abs(trend)}%</span>
          </div>
          <span className="text-muted-foreground truncate">{trendLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
