import ProductDetailsTabs from '../tabs';

interface AuctionDescription {
  about: string;
  mechanical: string[];
}

interface ProductTabsContentProps {
  description?: AuctionDescription;
}

const defaultDescription: AuctionDescription = {
  about:
    'Introducing the Audi RSQ8, a masterpiece in automotive engineering, featuring a stunning white exterior and a sleek black interior. Transmission enthusiasts will be delighted by the 6-speed manual gearbox, offering a direct connection to the road. The odometer proudly displays just around 900 miles, a testament to the care this vehicle has received.',
  mechanical: [
    'Fuel Safe 22-gallon fuel cell',
    'Ron Davis 4-core radiator',
    'Ultra Pro oil cooler with fan pack on transmission and differential',
    'Power-assisted rack and pinion steering',
    'KRC power steering cooler',
    'KRC steering pump',
  ],
};

export default function ProductTabsContent({
  description = defaultDescription,
}: ProductTabsContentProps) {
  const tabs = [
    {
      value: 'description',
      label: 'Description',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              About
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              {description.about}
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              Mechanical
            </h3>
            <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
              {description.mechanical.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ol>
          </div>
        </div>
      ),
    },
    {
      value: 'additional',
      label: 'Additional Information',
      content: <div className="grid gap-4" />,
    },
    {
      value: 'terms',
      label: 'Terms & Conditions',
      content: <div className="prose prose-sm max-w-none" />,
    },
    {
      value: 'document',
      label: 'Documents',
      content: <div className="prose prose-sm max-w-none" />,
    },
  ];

  return <ProductDetailsTabs tabs={tabs} />;
}
