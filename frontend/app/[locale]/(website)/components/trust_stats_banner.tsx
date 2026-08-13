import { Gavel, Users, TrendingUp, Shield } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '50,000+',
    label: 'Active Bidders',
    description: 'Verified buyers across Nigeria',
  },
  {
    icon: Gavel,
    value: '2,500+',
    label: 'Live Auctions',
    description: 'Active listings every month',
  },
  {
    icon: TrendingUp,
    value: '₦2.5B+',
    label: 'Total Bids Placed',
    description: 'In transactions processed',
  },
  {
    icon: Shield,
    value: '1,200+',
    label: 'Verified Sellers',
    description: 'Trusted business partners',
  },
];

export default function TrustStatsBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-background to-primary/5 border-y border-border/50">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group flex flex-col items-center text-center"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:shadow-lg">
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold text-foreground sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {stat.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
