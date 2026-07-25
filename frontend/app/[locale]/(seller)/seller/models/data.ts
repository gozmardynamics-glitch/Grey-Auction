const CATEGORIES = [
  {
    id: '1',
    name: 'Automotive',
    icon: '/car.svg',
    slug: 'automotive',
  },
  {
    id: '2',
    name: 'Electronics',
    icon: '/gen.svg',
    slug: 'electronics',
  },
  {
    id: '3',
    name: 'Fashion',
    icon: '/brushes.svg',
    slug: 'fashion',
  },
  {
    id: '4',
    name: 'Home & Garden',
    icon: '/chair.svg',
    slug: 'home-garden',
  },
  {
    id: '5',
    name: 'Sports & Outdoors',
    icon: '/tractor.svg',
    slug: 'sports-outdoors',
  },
  {
    id: '6',
    name: 'Books & Media',
    icon: '/cartridge.svg',
    slug: 'books-media',
  },
  {
    id: '7',
    name: 'Business & Industrial',
    icon: '/laptop.svg',
    slug: 'business-industrial',
  },
  {
    id: '8',
    name: 'Health & Beauty',
    icon: '/brushes.svg',
    slug: 'health-beauty',
  },
  {
    id: '9',
    name: 'Toys & Hobbies',
    icon: '/tractor.svg',
    slug: 'toys-hobbies',
  },
  {
    id: '10',
    name: 'Food & Beverages',
    icon: '/agric.svg',
    slug: 'food-beverages',
  },
];

const VALUE_RANGES = [
  { id: '1', label: 'Under ₦10,000', min: 0, max: 10000 },
  { id: '2', label: '₦10,000 - ₦50,000', min: 10000, max: 50000 },
  { id: '3', label: '₦50,000 - ₦100,000', min: 50000, max: 100000 },
  { id: '4', label: '₦100,000 - ₦500,000', min: 100000, max: 500000 },
  { id: '5', label: '₦500,000 - ₦1,000,000', min: 500000, max: 1000000 },
  { id: '6', label: '₦1,000,000 - ₦5,000,000', min: 1000000, max: 5000000 },
  { id: '7', label: '₦5,000,000 - ₦10,000,000', min: 5000000, max: 10000000 },
  { id: '8', label: 'Over ₦10,000,000', min: 10000000, max: Infinity },
];

export { CATEGORIES, VALUE_RANGES };
