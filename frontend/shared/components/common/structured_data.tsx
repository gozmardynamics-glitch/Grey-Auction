interface AuctionSchemaProps {
  name: string;
  description: string;
  image: string;
  offers?: {
    price: number;
    priceCurrency: string;
    availability: string;
  };
}

export function AuctionSchema({
  name,
  description,
  image,
  offers,
}: AuctionSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    ...(offers
      ? {
          offers: {
            '@type': 'Offer',
            price: offers.price,
            priceCurrency: offers.priceCurrency,
            availability: offers.availability,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
