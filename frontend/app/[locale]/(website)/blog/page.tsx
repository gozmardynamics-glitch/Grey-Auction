import { CalendarDays, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardFooter } from '@/shared/components/common/card';
import { Badge } from '@/shared/components/common/badge';
import { Button } from '@/shared/components/common/button';

const blogPosts = [
  {
    id: 1,
    title: 'The Rise of Online Auctions: A New Era of Bidding',
    excerpt:
      'Discover how digital platforms are transforming the auction industry, making it more accessible than ever before.',
    date: 'July 15, 2026',
    category: 'Industry',
    image: null,
  },
  {
    id: 2,
    title: 'Top 10 Tips for First-Time Auction Buyers',
    excerpt:
      'New to auctions? Here are essential strategies to help you navigate the bidding process with confidence.',
    date: 'June 28, 2026',
    category: 'Buying',
    image: null,
  },
  {
    id: 3,
    title: 'How to Spot Valuable Collectibles at Auction',
    excerpt:
      'Learn the key indicators experienced collectors look for when evaluating rare items and antiques.',
    date: 'May 18, 2026',
    category: 'Collectibles',
    image: null,
  },
  {
    id: 4,
    title: 'Understanding Auction Fees and Buyer Premiums',
    excerpt:
      'A clear breakdown of the costs involved when bidding and buying at auction houses worldwide.',
    date: 'April 05, 2026',
    category: 'Buying',
    image: null,
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-2xl sm:text-4xl font-bold text-foreground">
            Blog
          </h1>
          <p className="text-muted-foreground">
            Insights, tips, and stories from the world of auctions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Card
              key={post.id}
              className="flex flex-col overflow-hidden bg-card border-none"
            >
              <div className="aspect-video w-full bg-muted" />

              <CardContent className="flex-1 space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {post.date}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-foreground leading-snug">
                  {post.title}
                </h3>

                <p className="text-sm text-muted-foreground line-clamp-3">
                  {post.excerpt}
                </p>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button variant="ghost" size="sm" asChild>
                  <a href="#" className="group">
                    Read More
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
