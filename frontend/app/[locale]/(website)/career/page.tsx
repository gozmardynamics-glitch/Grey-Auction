import {
  Heart,
  Zap,
  Users,
  MapPin,
  Briefcase,
  Clock,
  ArrowRight,
} from 'lucide-react';

import { Card, CardContent, CardFooter } from '@/shared/components/common/card';
import { Badge } from '@/shared/components/common/badge';
import { Button } from '@/shared/components/common/button';

const benefits = [
  {
    icon: Heart,
    title: 'Great Culture',
    description:
      'We foster a collaborative, inclusive environment where every team member can thrive and grow.',
  },
  {
    icon: Zap,
    title: 'Innovative Work',
    description:
      'Build cutting-edge auction technology that connects buyers and sellers across the globe.',
  },
  {
    icon: Users,
    title: 'Amazing People',
    description:
      'Join a diverse team of passionate professionals who love what they do and support each other.',
  },
];

const openings = [
  {
    id: 1,
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Lagos, Nigeria',
    type: 'Full-time',
  },
  {
    id: 2,
    title: 'Backend Developer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    id: 3,
    title: 'UI/UX Designer',
    department: 'Design',
    location: 'Lagos, Nigeria',
    type: 'Contract',
  },
  {
    id: 4,
    title: 'Marketing Specialist',
    department: 'Marketing',
    location: 'Lagos, Nigeria',
    type: 'Full-time',
  },
];

export default function CareerPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-20 text-center">
          <h1 className="mb-4 text-3xl sm:text-5xl font-bold text-foreground">
            Join Our Team
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Help us build the future of online auctions. We are looking for
            talented individuals who are passionate about technology and
            innovation.
          </p>
          <div className="mt-6">
            <Button asChild>
              <a href="#openings">View Open Positions</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Why Work With Us */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl sm:text-3xl font-bold text-foreground">
            Why Work With Us
          </h2>
          <p className="text-muted-foreground">
            Here is what makes GreyAuction a great place to build your career.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={benefit.title}
                className="bg-card border-none text-center"
              >
                <CardContent className="flex flex-col items-center p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Current Openings */}
      <div id="openings" className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl sm:text-3xl font-bold text-foreground">
            Current Openings
          </h2>
          <p className="text-muted-foreground">
            Explore our open positions and find your next opportunity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {openings.map((job) => (
            <Card
              key={job.id}
              className="bg-card border-none"
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {job.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {job.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{job.type}</Badge>
                    <Button variant="outline" size="sm" asChild>
                      <a href="#" className="group">
                        Apply Now
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
