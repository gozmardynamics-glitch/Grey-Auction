import type { Metadata } from 'next';
import { getAuctionBySlug } from '@/lib/server/data';
import { images, auctionDetails } from '../../models/data';
import ProductDetailsClient from './product_details_client';
import { AuctionSchema } from '@/shared/components/common/structured_data';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://greyauction.com';

interface ProductDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const auction = await getAuctionBySlug(slug);

  if (!auction) {
    return {
      title: 'Auction Not Found',
      description: 'The requested auction could not be found.',
    };
  }

  return {
    title: auction.title,
    description: auction.description?.slice(0, 160) || `${auction.title} - Bid now on GreyAuction`,
    openGraph: {
      title: auction.title,
      description: auction.description?.slice(0, 160),
      images: auction.imageUrl ? [{ url: auction.imageUrl }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: auction.title,
      description: auction.description?.slice(0, 160),
      images: auction.imageUrl ? [auction.imageUrl] : [],
    },
  };
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { slug } = await params;
  const auction = await getAuctionBySlug(slug);

  return (
    <>
      <AuctionSchema
        name={auction.title}
        description={auction.description}
        image={auction.imageUrl || `${BASE_URL}/placeholder.svg`}
        offers={{
          price: auction.currentBid,
          priceCurrency: 'NGN',
          availability: auction.status === 'sold'
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
        }}
      />
      <ProductDetailsClient
        auction={auction}
        images={images}
        auctionDetails={auctionDetails}
      />
    </>
  );
}
