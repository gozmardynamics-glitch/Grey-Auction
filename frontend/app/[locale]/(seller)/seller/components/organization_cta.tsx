'use client';

import { useRouter } from 'next/navigation';
import {
  Building2,
  Landmark,
  Globe,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  Truck,
  FileText,
} from 'lucide-react';
import { Button, Card } from '@/shared/components/common';

const orgTypes = [
  {
    icon: Building2,
    label: 'Companies & Firms',
    description: 'Corporate asset disposal, fleet liquidation, equipment auctions',
  },
  {
    icon: Landmark,
    label: 'Government Agencies',
    description: 'Public surplus, seized assets, official auctions',
  },
  {
    icon: Globe,
    label: 'Embassies & Missions',
    description: 'Diplomatic vehicle sales, office liquidation, relocation auctions',
  },
  {
    icon: HeartHandshake,
    label: 'NGOs & Institutions',
    description: 'Fundraising auctions, donated asset sales',
  },
];

const features = [
  { icon: ShieldCheck, text: 'Public or private auctions' },
  { icon: Truck, text: 'We can list items for you — FREE' },
  { icon: FileText, text: 'Reserve prices, hidden or exposed' },
];

export default function OrganizationCta() {
  const router = useRouter();

  return (
    <section className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white md:p-12">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left: pitch */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold">
            <Landmark className="h-4 w-4" />
            For Organizations
          </div>
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">
            Auction for Your Organization
          </h2>
          <p className="mb-6 text-white/80">
            Companies, government agencies, embassies, and institutions trust
            Grey Auction to dispose of assets transparently — with public or
            private auctions, consultant listing, and full control over reserve
            prices.
          </p>

          {/* Feature list */}
          <div className="mb-8 space-y-3">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <f.icon className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="text-sm text-white/90">{f.text}</span>
              </div>
            ))}
          </div>

          <Button
            size="xl"
            className="gap-2 bg-yellow-400 text-foreground hover:bg-yellow-500"
            onClick={() => router.push('/auth/organization/register')}
          >
            Register Your Organization
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: org type cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {orgTypes.map((org) => (
            <Card
              key={org.label}
              className="border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10 cursor-pointer"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <org.icon className="h-5 w-5 text-yellow-400" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">{org.label}</h3>
              <p className="text-xs text-white/60">{org.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
