import {
  Auction,
  AuctionDetail,
  Brand,
  Category,
  CosmeticCategory,
  FAQCategory,
  HeroSlide,
  Testimonial,
} from '.';

const trustedBrands: Brand[] = [
  { id: '1', name: 'Toyota', logo: '/car.svg', initials: 'T', color: 'bg-red-500' },
  { id: '2', name: 'BMW', logo: '/car.svg', initials: 'B', color: 'bg-blue-500' },
  { id: '3', name: 'Mercedes', logo: '/car.svg', initials: 'M', color: 'bg-green-500' },
  { id: '4', name: 'Ford', logo: '/car.svg', initials: 'F', color: 'bg-yellow-500' },
  { id: '5', name: 'Honda', logo: '/car.svg', initials: 'H', color: 'bg-purple-500' },
  { id: '6', name: 'Audi', logo: '/car.svg', initials: 'A', color: 'bg-pink-500' },
  { id: '7', name: 'Volkswagen', logo: '/car.svg', initials: 'V', color: 'bg-indigo-500' },
  { id: '8', name: 'Porsche', logo: '/car.svg', initials: 'P', color: 'bg-orange-500' },
  { id: '9', name: 'Hyundai', logo: '/car.svg', initials: 'H', color: 'bg-teal-500' },
  { id: '10', name: 'Volvo', logo: '/car.svg', initials: 'V', color: 'bg-cyan-500' },
  { id: '11', name: 'Nissan', logo: '/car.svg', initials: 'N', color: 'bg-rose-500' },
  { id: '12', name: 'Ferrari', logo: '/car.svg', initials: 'F', color: 'bg-emerald-500' },
];

const categories: Category[] = [
  { id: '1', name: 'Transport', image: '/transport.svg', slug: 'transport' },
  { id: '2', name: 'Agriculture', image: '/agric.svg', slug: 'agriculture' },
  {
    id: '3',
    name: 'Construction',
    image: '/construction.svg',
    slug: 'construction',
  },
  { id: '4', name: 'Fashion', image: '/fashion.svg', slug: 'fashion' },
  { id: '5', name: 'Electronics', image: '/gen.svg', slug: 'electronics' },
  { id: '6', name: 'Real Estate', image: '/chair.svg', slug: 'real-estate' },
  { id: '7', name: 'Art', image: '/laptop.svg', slug: 'art' },
  { id: '8', name: 'Music', image: '/brushes.svg', slug: 'music' },
  { id: '9', name: 'Sports', image: '/tractor.svg', slug: 'sports' },
  { id: '10', name: 'Books', image: '/cartridge.svg', slug: 'books' },
];

const heroSlides: HeroSlide[] = [
  {
    id: '1',
    variant: 'split',
    heading: 'Buy & Sell Smarter with Live Auctions',
    description:
      'Join a secure marketplace where buyers compete in real-time auctions and sellers reach genuine buyers faster — all in one powerful platform.',
    primaryCta: 'Start Bidding',
    secondaryCta: 'Become a Seller',
    product: {
      title: 'Vintage Camera',
      specs: '2022 · 14 km · 2,487 cm3 · Hybrid',
      currentBid: '5000000',
      image: '/camera.svg',
      category: 'Transport',
    },
    backgroundImage: '/banner_image.svg',
  },
  {
    id: '2',
    variant: 'featured',
    heading: '2016 Dutch Dragon EC 9045 Wood Chipper',
    description:
      'Access exclusive collections and rare finds through our transparent bidding system. Every auction is monitored for authenticity and fair play.',
    primaryCta: 'Place a Bid Now',
    currentBid: '35M',
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    backgroundImage: '/car.svg',
  },
  {
    id: '3',
    variant: 'category',
    heading: 'Heavy agricultural, and construction equipment',
    description:
      'From vintage collectibles to modern electronics, find unique items daily. Join thousands of satisfied buyers and sellers in our growing community.',
    primaryCta: 'Place Bid',
    secondaryCta: 'View Auctions',
    startingBid: '35M',
    thumbnails: ['/tractor.svg', '/chair.svg'],
    backgroundImage: '/tractor.svg',
  },
];

const dummyAuctions: Auction[] = [
  {
    id: '1',
    title: '2022 Toyota Camry Hybrid',
    description: 'Excellent condition hybrid vehicle with low mileage',
    currentBid: 2500000,
    startingBid: 2000000,
    totalBids: 12,
    timeLeft: '2 days 5 hours',
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    imageUrl: '/chair.svg',
    category: 'transport',
    sellerId: 'seller1',
    sellerName: 'John Doe',
    status: 'active',
    isNew: true,
    location: {
      city: 'Lagos',
      country: 'Nigeria',
      countryCode: 'NG',
    },
    auctionType: 'bid',
    specs: '2022 · 14,000 km · 2,487 cm3 · Hybrid',
    rating: 4.8,
    reviewCount: 124,
  },
  {
    id: '2',
    title: 'MacBook Pro 16" M3',
    description: 'Latest MacBook Pro with M3 chip, 16GB RAM, 512GB SSD',
    currentBid: 1850000,
    startingBid: 1500000,
    totalBids: 8,
    timeLeft: '1 day 12 hours',
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    imageUrl: '/gen.svg',
    category: 'transport',
    sellerId: 'seller2',
    sellerName: 'Tech Store',
    status: 'live',
    isNew: false,
    trending: true,
    location: {
      city: 'Abuja',
      country: 'Nigeria',
      countryCode: 'NG',
    },
    auctionType: 'bid',
    specs: 'M3 Pro · 16GB RAM · 512GB SSD · Space Gray',
    rating: 4.5,
    reviewCount: 89,
  },
  {
    id: '3',
    title: 'iPhone 15 Pro Max',
    description: 'Brand new iPhone 15 Pro Max, 256GB, Titanium',
    currentBid: 980000,
    startingBid: 850000,
    totalBids: 15,
    timeLeft: '3 days 8 hours',
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    imageUrl: '/gen.svg',
    category: 'transport',
    sellerId: 'seller3',
    sellerName: 'Mobile World',
    status: 'new',
    isNew: true,
    location: {
      city: 'Port Harcourt',
      country: 'Nigeria',
      countryCode: 'NG',
    },
    auctionType: 'buy',
    specs: '256GB · Titanium · 6.7" · Pro Max',
    rating: 4.2,
    reviewCount: 56,
  },
  {
    id: '4',
    title: 'Luxury Designer Watch',
    description: 'Authentic designer watch, brand new with box and papers',
    currentBid: 450000,
    startingBid: 350000,
    totalBids: 6,
    timeLeft: '5 days 2 hours',
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    imageUrl: '/tractor.svg',
    category: 'transport',
    sellerId: 'seller4',
    sellerName: 'Luxury Store',
    status: 'sold',
    isNew: false,
    location: {
      city: 'Kano',
      country: 'Nigeria',
      countryCode: 'NG',
    },
    auctionType: 'bid',
    specs: 'Designer · Swiss Movement · Leather Strap · Limited Edition',
    rating: 4.9,
    reviewCount: 203,
  },
  {
    id: '5',
    title: 'Construction Equipment Bundle',
    description:
      'Heavy duty construction equipment including excavator and bulldozer',
    currentBid: 3200000,
    startingBid: 2800000,
    totalBids: 4,
    timeLeft: '4 days 14 hours',
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    imageUrl: '/chair.svg',
    category: 'transport',
    sellerId: 'seller5',
    sellerName: 'BuildMart',
    status: 'active',
    isNew: true,
    location: {
      city: 'Ibadan',
      country: 'Nigeria',
      countryCode: 'NG',
    },
    auctionType: 'bid',
    specs: 'Heavy Duty · 2021 Model · Full Service History',
    rating: 3.8,
    reviewCount: 34,
  },
  {
    id: '6',
    title: 'Professional Camera Kit',
    description:
      'Complete photography kit with camera, lenses, and accessories',
    currentBid: 780000,
    startingBid: 650000,
    totalBids: 9,
    timeLeft: '6 days 10 hours',
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    imageUrl: '/gen.svg',
    category: 'transport',
    sellerId: 'seller6',
    sellerName: 'Photo Pro',
    status: 'active',
    isNew: false,
    trending: true,
    location: {
      city: 'Enugu',
      country: 'Nigeria',
      countryCode: 'NG',
    },
    auctionType: 'bid',
    specs: 'Full Frame · 4K Video · Dual Card Slots · Weather Sealed',
    rating: 4.6,
    reviewCount: 78,
  },
  {
    id: '7',
    title: 'Transport Logistics Service',
    description: 'Complete logistics and transport solution for businesses',
    currentBid: 1200000,
    startingBid: 1000000,
    totalBids: 3,
    timeLeft: '2 days 18 hours',
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    imageUrl: '/chair.svg',
    category: 'transport',
    sellerId: 'seller7',
    sellerName: 'Logistics Plus',
    status: 'active',
    isNew: true,
    location: {
      city: 'Onitsha',
      country: 'Nigeria',
      countryCode: 'NG',
    },
    auctionType: 'bid',
    specs: 'Nationwide Coverage · GPS Tracking · Insured Delivery',
    rating: 4.0,
    reviewCount: 42,
  },
  {
    id: '8',
    title: 'Art Collection Piece',
    description: 'Original artwork from renowned Nigerian artist',
    currentBid: 890000,
    startingBid: 750000,
    totalBids: 11,
    timeLeft: '7 days 4 hours',
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    imageUrl: '/brushes.svg',
    category: 'transport',
    sellerId: 'seller8',
    sellerName: 'Art Gallery',
    status: 'live',
    isNew: false,
    trending: true,
    location: {
      city: 'Benin City',
      country: 'Nigeria',
      countryCode: 'NG',
    },
    auctionType: 'bid',
    specs: 'Oil on Canvas · 24" x 36" · Certificate of Authenticity',
    watchersCount: 45,
    rating: 4.7,
    reviewCount: 156,
  },
  {
    id: '9',
    title: 'MacBook Pro 16" M3',
    description: 'Latest MacBook Pro with M3 chip, 16GB RAM, 512GB SSD',
    currentBid: 1850000,
    startingBid: 1500000,
    totalBids: 8,
    timeLeft: '1 day 12 hours',
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    imageUrl: '/gen.svg',
    category: 'transport',
    sellerId: 'seller2',
    sellerName: 'Tech Store',
    status: 'live',
    isNew: false,
    trending: true,
    location: {
      city: 'Abuja',
      country: 'Nigeria',
      countryCode: 'NG',
    },
    auctionType: 'bid',
    specs: 'M3 Pro · 16GB RAM · 512GB SSD · Space Gray',
    rating: 4.5,
    reviewCount: 89,
  },
  {
    id: '10',
    title: 'Professional Camera Kit',
    description:
      'Complete photography kit with camera, lenses, and accessories',
    currentBid: 780000,
    startingBid: 650000,
    totalBids: 9,
    timeLeft: '6 days 10 hours',
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    imageUrl: '/gen.svg',
    category: 'transport',
    sellerId: 'seller6',
    sellerName: 'Photo Pro',
    status: 'active',
    isNew: false,
    trending: true,
    location: {
      city: 'Enugu',
      country: 'Nigeria',
      countryCode: 'NG',
    },
    auctionType: 'bid',
    specs: 'Full Frame · 4K Video · Dual Card Slots · Weather Sealed',
    rating: 4.6,
    reviewCount: 78,
  },
];

const cosmeticCategories: CosmeticCategory[] = [
  {
    id: '1',
    title: 'Retail and Office',
    backgroundColor: 'bg-[#E1F6FF]',
    textColor: 'text-gray-900',
    categorySlug: 'retail-office',
    subCategories: [
      { id: '1-1', name: 'Office Inventory', slug: 'office-inventory' },
      { id: '1-2', name: 'Printer', slug: 'printer' },
      { id: '1-3', name: 'Shop Furniture', slug: 'shop-furniture' },
    ],
    image: '/cartridge.svg',
    imageAlt: 'Office printer cartridge',
  },
  {
    id: '2',
    title: 'Beauty and Health',
    backgroundColor: 'bg-[#FFF4E1]',
    textColor: 'text-gray-900',
    categorySlug: 'beauty-health',
    subCategories: [
      { id: '2-1', name: 'Personal care', slug: 'personal-care' },
      { id: '2-2', name: 'Make-up', slug: 'make-up' },
      { id: '2-3', name: 'Health', slug: 'health' },
    ],
    image: '/brushes.svg',
    imageAlt: 'Makeup brushes',
  },
  {
    id: '3',
    title: 'Electronics and Gadgets',
    backgroundColor: 'bg-[#F0EBFF]',
    textColor: 'text-gray-900',
    categorySlug: 'electronics-gadgets',
    subCategories: [
      { id: '3-1', name: 'Headset', slug: 'headset' },
      { id: '3-2', name: 'Computer & Tablets', slug: 'computer-tablets' },
      { id: '3-3', name: 'TV & Audio', slug: 'tv-audio' },
    ],
    image: '/laptop.svg',
    imageAlt: 'Laptop computer',
  },
];

const testimonials: Testimonial[] = [
  {
    id: '1',
    quote:
      'Bidding is fast, simple, and transparent. I won my first auction in minutes.',
    name: 'Mc Folarin',
    role: 'CEO',
    company: 'Coco',
    image: '/camera.svg',
  },
  {
    id: '2',
    quote:
      'Bidding is fast, simple, and transparent. I won my first auction in minutes.',
    name: 'Mc Folarin',
    role: 'CEO',
    company: 'Coco',
    image: '/buggy.svg',
  },
  {
    id: '3',
    quote:
      'Bidding is fast, simple, and transparent. I won my first auction in minutes.',
    name: 'Mc Folarin',
    role: 'CEO',
    company: 'Coco',
    image: '/brushes.svg',
  },
  {
    id: '4',
    quote:
      'Bidding is fast, simple, and transparent. I won my first auction in minutes.',
    name: 'Mc Folarin',
    role: 'CEO',
    company: 'Coco',
    image: '/tractor.svg',
  },
];

const CATEGORIES = [
  'Automotive',
  'Agricultural',
  'Beauty and Health',
  'Office Inventory',
  'Food Industry',
  'Government',
  'Embassy',
  'Corporate',
  'Private Room',
];

const COUNTRIES = [
  'Nigeria',
  'Belgium',
  'Cameroon',
  'United States',
  'United Kingdom',
];

const BRANDS = ['Sony', 'LG', 'Spectra', 'HP'];

const images = ['/car.svg', '/tractor.svg', '/car.svg', '/tractor.svg'];

const auctionDetails: AuctionDetail[] = [
  { label: 'Body', value: 'Crossover' },
  { label: 'Airbags', value: 'Curtain, Frontal, Knee' },
  { label: 'Climatisation', value: 'Multi-Zone Climate Control' },
  { label: 'Color', value: 'Black' },
  { label: 'Door Count', value: '4-door' },
  { label: 'Cubic Capacity', value: '4.0L' },
  { label: 'Emission Class', value: '6' },
  { label: 'Gearbox', value: 'Automatic' },
  { label: 'Mileage', value: '178708km' },
  { label: 'Seat Count', value: '6' },
  { label: 'Parking sensors', value: 'Frontal, Rear view Camera' },
  { label: 'Power', value: '6.5kW' },
];

const faqCategories: FAQCategory[] = [
  {
    name: 'General',
    emoji: '📦',
    items: [
      {
        question: 'What is this platform about?',
        answer:
          'This platform allows users to buy and sell items through online auctions and direct purchases in a secure and transparent environment.',
      },
      {
        question: 'Do I need an account to browse items?',
        answer:
          'No, you can browse items freely. However, you need an account to place bids, make purchases, or list items for sale.',
      },
      {
        question: 'Is the platform free to use?',
        answer:
          'Browsing and creating an account is free. A small commission is charged on successful auction sales.',
      },
      {
        question: 'What countries do you support?',
        answer:
          'We currently support Nigeria, Belgium, Cameroon, United States, and United Kingdom, with more countries coming soon.',
      },
      {
        question: 'How do I contact support?',
        answer:
          'You can reach our support team via the Contact Us page, email at info@grayauctions.com, or call +2347081436524.',
      },
    ],
  },
  {
    name: 'Bidding & Auctions',
    emoji: '⚡',
    items: [
      {
        question: 'How does bidding work?',
        answer:
          'Place a bid on any active auction. If your bid is the highest when the auction ends, you win the item. You can set a maximum bid and the system will automatically bid on your behalf up to that amount.',
      },
      {
        question: 'What is a reserve price?',
        answer:
          'A reserve price is the minimum amount a seller is willing to accept. If bidding does not reach the reserve price, the item will not be sold.',
      },
      {
        question: 'What does "Minimum Bid" mean?',
        answer:
          'The minimum bid is the lowest amount you can bid on an item. Each subsequent bid must be higher than the current bid by a set increment.',
      },
      {
        question: 'What is an automatic (maximum) bid?',
        answer:
          'An automatic bid lets you set your maximum price. The system will incrementally bid on your behalf, only going as high as needed to stay the top bidder, up to your maximum.',
      },
      {
        question: 'Can I cancel a bid?',
        answer:
          'Bids are binding and generally cannot be cancelled. Please review all item details carefully before placing a bid.',
      },
    ],
  },
  {
    name: 'Buying & Payments',
    emoji: '💰',
    items: [
      {
        question: 'What happens after I win an auction?',
        answer:
          'You will receive a notification and invoice. Payment must be completed within the specified timeframe to secure your purchase.',
      },
      {
        question: 'What payment methods are supported?',
        answer:
          'We accept credit/debit cards (Visa, Mastercard, Amex), bank transfers, and selected local payment methods.',
      },
      {
        question: 'Is my payment secure?',
        answer:
          'Yes, all payments are processed through secure, encrypted channels. We never store your full card details.',
      },
      {
        question: 'Can I use Buy Now instead of bidding?',
        answer:
          'Some listings offer a Buy Now option that lets you purchase the item immediately at a fixed price without waiting for the auction to end.',
      },
    ],
  },
  {
    name: 'Delivery & Inspection',
    emoji: '📋',
    items: [
      {
        question: 'Can I inspect an item before delivery?',
        answer:
          'Yes, inspection times are listed on each auction page. You can arrange to inspect items in person during the specified inspection window.',
      },
      {
        question: 'Who confirms delivery?',
        answer:
          'Both the buyer and seller confirm delivery through the platform. This ensures both parties agree the transaction is complete.',
      },
      {
        question: "What if there's an issue with the item?",
        answer:
          'Contact our support team immediately. We have a dispute resolution process to handle any issues with items that do not match their listing description.',
      },
    ],
  },
  {
    name: 'Payments & Withdrawals',
    emoji: '💳',
    items: [
      {
        question: 'How do I withdraw my earnings as a seller?',
        answer:
          'Navigate to your seller dashboard and request a withdrawal. Funds are typically transferred to your registered bank account within 3-5 business days.',
      },
      {
        question: 'Are there any fees for withdrawals?',
        answer:
          'Standard withdrawals are free. Express withdrawals may incur a small processing fee depending on your region.',
      },
      {
        question: 'What currency are transactions in?',
        answer:
          'All transactions on the platform are in Nigerian Naira (₦). Currency conversion is handled automatically for international users.',
      },
    ],
  },
];

export {
  trustedBrands,
  categories,
  heroSlides,
  dummyAuctions,
  cosmeticCategories,
  testimonials,
  CATEGORIES,
  COUNTRIES,
  BRANDS,
  images,
  auctionDetails,
  faqCategories,
};
