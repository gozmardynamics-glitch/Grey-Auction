import { getAuctionBySlug } from '@/lib/server/data';
import { images, auctionDetails } from '../../models/data';
import ProductDetailsClient from './product_details_client';

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const auction = await getAuctionBySlug(slug);

  return (
    <ProductDetailsClient
      auction={auction}
      images={images}
      auctionDetails={auctionDetails}
    />
  );
}
