'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/redux/store';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/components/common';
import { ShoppingBag, Package, Star, Wallet } from 'lucide-react';

interface PeriodStats {
  total_sales: number;
  total_orders: number;
  completed_orders: number;
  products_listed: number;
  products_sold: number;
  reviews_received: number;
  average_rating: number;
  positive_reviews: number;
  negative_reviews: number;
}

const INFLATABLE = (p: any) => ({
  total_sales: Number(p?.total_sales || 0),
  total_orders: Number(p?.total_orders || 0),
  completed_orders: Number(p?.completed_orders || 0),
  products_listed: Number(p?.products_listed || 0),
  products_sold: Number(p?.products_sold || 0),
  reviews_received: Number(p?.reviews_received || 0),
  average_rating: Number(p?.average_rating || 0),
  positive_reviews: Number(p?.positive_reviews || 0),
  negative_reviews: Number(p?.negative_reviews || 0),
});

export default function SellerAnalytics() {
  const token = useAppSelector((state) => state.auth.token);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const [months, setMonths] = useState<{ label: string; sales: number; orders: number }[]>([]);
  const [current, setCurrent] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      const now = new Date();
      const series: { label: string; sales: number; orders: number }[] = [];
      const requests = [];
      for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const label = d.toLocaleString('en', { month: 'short' });
        requests.push(
          fetch(
            apiBase + '/seller/statistics/me?period=MONTHLY&year=' + year + '&month=' + month,
            { headers: { Authorization: 'Bearer ' + token } },
          )
            .then((r) => r.json())
            .then((j) => {
              const data = j?.data;
              const s = INFLATABLE(data);
              series.push({ label, sales: s.total_sales, orders: s.total_orders });
              return s;
            })
            .catch(() => INFLATABLE(null)),
        );
      }
      const resolved = await Promise.all(requests);
      const last = resolved[resolved.length - 1];
      setMonths(series);
      setCurrent(last);
      setLoading(false);
    };
    load();
  }, [token, apiBase]);

  if (loading) return <Skeleton className="h-64 rounded-lg" />;

  const maxSales = Math.max(1, ...months.map((m) => m.sales));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Wallet} label="Sales (this month)" value={current ? String(current.total_sales) : '0'} />
        <Kpi icon={ShoppingBag} label="Orders" value={String(current?.total_orders ?? 0)} />
        <Kpi icon={Package} label="Products sold" value={String(current?.products_sold ?? 0)} />
        <Kpi icon={Star} label="Avg rating" value={current ? current.average_rating.toFixed(1) : '0.0'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Monthly sales (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-end gap-2">
            {months.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: Math.round((m.sales / maxSales) * 120) + 'px' }}
                  title={String(m.sales)}
                />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {current && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Listed vs sold</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-around text-center text-sm">
              <div>
                <p className="text-lg font-semibold">{current.products_listed}</p>
                <p className="text-xs text-muted-foreground">Listed</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{current.products_sold}</p>
                <p className="text-xs text-muted-foreground">Sold</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Reviews (this month)</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-around text-center text-sm">
              <div>
                <p className="text-lg font-semibold">{current.positive_reviews}</p>
                <p className="text-xs text-muted-foreground">Positive (4-5)</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{current.negative_reviews}</p>
                <p className="text-xs text-muted-foreground">Negative (1-2)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
