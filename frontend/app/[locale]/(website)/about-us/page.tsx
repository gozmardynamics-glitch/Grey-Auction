import {
  Shield,
  Lightbulb,
  Globe,
  Eye,
  Gavel,
  TrendingUp,
  Headphones,
  Calendar,
} from 'lucide-react';

import { Card, CardContent } from '@/shared/components/common/card';

const values = [
  {
    icon: Shield,
    title: 'Trust',
    description:
      'We operate with integrity and transparency, building lasting relationships with our buyers and sellers.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description:
      'We leverage cutting-edge technology to create a seamless and secure auction experience for all users.',
  },
  {
    icon: Globe,
    title: 'Community',
    description:
      'We bring together a vibrant community of collectors, dealers, and enthusiasts from around the world.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    description:
      'Every bid, every sale, and every transaction is transparent, ensuring a fair marketplace for everyone.',
  },
];

const stats = [
  {
    icon: Calendar,
    value: 'Founded 2024',
    label: 'Year',
  },
  {
    icon: TrendingUp,
    value: '10,000+',
    label: 'Users',
  },
  {
    icon: Gavel,
    value: '50,000+',
    label: 'Auctions',
  },
  {
    icon: Headphones,
    value: '24/7',
    label: 'Support',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-20 text-center">
          <h1 className="mb-4 text-3xl sm:text-5xl font-bold text-foreground">
            About GreyAuction
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground leading-relaxed">
            GreyAuction is a premier online auction platform that connects buyers
            and sellers across the globe. We provide a secure, transparent, and
            exciting marketplace where rare collectibles, antiques, and one-of-a-kind
            items find new homes every day.
          </p>
        </div>
      </div>

      {/* Our Mission */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-2xl sm:text-3xl font-bold text-foreground">
            Our Mission
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            To democratize the auction experience by making it accessible,
            transparent, and trustworthy for everyone — from seasoned collectors
            to first-time bidders around the world.
          </p>
        </div>
      </div>

      {/* Our Values */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl sm:text-3xl font-bold text-foreground">
            Our Values
          </h2>
          <p className="text-muted-foreground">
            The principles that guide everything we do.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <Card
                key={value.title}
                className="bg-card border-none text-center"
              >
                <CardContent className="flex flex-col items-center p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Our Story */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-center text-2xl sm:text-3xl font-bold text-foreground">
              Our Story
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                GreyAuction was founded in 2024 with a simple yet powerful idea:
                make auctions accessible to everyone, everywhere. What started as
                a small team of passionate auction enthusiasts has grown into a
                thriving platform serving thousands of users across the globe.
              </p>
              <p>
                Our platform combines the excitement of live bidding with the
                convenience of modern technology. We have built a secure,
                transparent ecosystem where sellers can reach a global audience
                and buyers can discover unique items from the comfort of their
                homes.
              </p>
              <p>
                Today, GreyAuction hosts thousands of auctions every month,
                spanning categories from fine art and antiques to vehicles and
                electronics. Our commitment to innovation and customer
                satisfaction continues to drive us forward as we shape the future
                of online auctions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="bg-card border-none text-center"
              >
                <CardContent className="flex flex-col items-center p-6">
                  <Icon className="mb-3 h-8 w-8 text-primary" />
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
