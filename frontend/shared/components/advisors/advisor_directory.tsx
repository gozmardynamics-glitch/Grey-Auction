'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin, Phone, Briefcase, BadgeCheck } from 'lucide-react';
import { Card } from '@/shared/components/common';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Advisor {
  id: string;
  name: string;
  type: 'advisor' | 'dealer' | 'branch';
  specialty?: string | null;
  description?: string | null;
  city: string;
  region?: string | null;
  country: string;
  phone?: string | null;
  email?: string | null;
}

const TYPE_LABEL: Record<Advisor['type'], string> = {
  advisor: 'Advisor',
  dealer: 'Dealer',
  branch: 'Branch',
};

/**
 * Marketplace advisor directory (L8). Lists advisors/dealers/branches grouped
 * by region so buyers can find a local expert. Lat/lng are stored for a future
 * interactive map render.
 */
export function AdvisorDirectory() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [region, setRegion] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_BASE + '/advisors', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setAdvisors(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setAdvisors([]))
      .finally(() => setLoading(false));
  }, []);

  const regions = useMemo(() => {
    const set = new Set(advisors.map((a) => a.region || a.city).filter(Boolean));
    return ['All', ...Array.from(set).sort()] as string[];
  }, [advisors]);

  const visible = region === 'All' ? advisors : advisors.filter((a) => (a.region || a.city) === region);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {regions.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={
              'rounded-full border px-3 py-1 text-xs font-medium ' +
              (region === r ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:bg-muted')
            }
          >
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading advisors...</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No advisors listed in this region yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((a) => (
            <Card key={a.id} className="space-y-2 p-4" data-testid="advisor-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <Briefcase className="mr-1 inline h-3 w-3" />
                    {TYPE_LABEL[a.type]}
                    {a.specialty ? ' - ' + a.specialty : ''}
                  </p>
                </div>
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
              </div>
              {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {a.city}, {a.country}
                </p>
                {a.phone && (
                  <p className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {a.phone}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdvisorDirectory;
