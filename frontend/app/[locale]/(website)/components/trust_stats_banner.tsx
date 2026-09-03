import { Gavel, Users, TrendingUp, Shield } from 'lucide-react';

const stats = [
  { icon: Users, value: '50,000+', label: 'Active Bidders', description: 'Verified buyers across Nigeria' },
  { icon: Gavel, value: '2,500+', label: 'Live Auctions', description: 'Active listings every month' },
  { icon: TrendingUp, value: '₦2.5B+', label: 'Total Bids Placed', description: 'In transactions processed' },
  { icon: Shield, value: '1,200+', label: 'Verified Sellers', description: 'Trusted business partners' },
];

export default function TrustStatsBanner() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-background to-secondary/[0.03]" />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-1.5">Trusted Platform</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Numbers That Speak</h2>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group flex flex-col items-center text-center reveal"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.06] text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/20 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{stat.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}