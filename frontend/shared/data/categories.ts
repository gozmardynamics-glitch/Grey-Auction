export const CATEGORIES_MAP: Record<string, string[]> = {
  Agriculture: ['Tractors', 'Harvesters', 'Seeders', 'Irrigation'],
  'Food Industry': ['Bakery', 'Beverages', 'Packaging', 'Processing'],
  Construction: ['Cranes', 'Excavators', 'Loaders', 'Concrete'],
  'Transport and Logistics': [
    'Cars',
    'Trucks',
    'Trailers',
    'Motorcycles',
    'Army Trucks',
  ],
  'Renewable Energy': ['Solar Panels', 'Wind Turbines', 'Batteries'],
  Events: ['Staging', 'Lighting', 'Sound', 'Furniture'],
  Electronics: ['Phones', 'Laptops', 'Cameras', 'Audio'],
  Fashion: [
    'Jewellery',
    'Women',
    'Men',
    'Towel',
    'Sport Shoes',
    'Watches',
    'Bags',
    'Unisex',
    'Swimwear',
    'Cycling Wear',
  ],
  'Beauty & Health': ['Skincare', 'Haircare', 'Supplements', 'Devices'],
  Government: [
    'Federal',
    'State',
    'Ministries',
    'Parastatals',
    'Agencies & Commissions',
    'Security & Defence',
  ],
  Embassy: ['Embassy Household', 'Diplomatic Vehicles', 'Consular Assets'],
  Corporate: [
    'Fleet Vehicles',
    'IT Equipment',
    'Office Furniture',
    'Machinery & Plant',
    'Property & Land',
  ],
  'Private Room': [],
};

/** Categories whose subcategories are institutional arms (drives the tabbed listing). */
export const BRANCH_CATEGORIES: string[] = [
  'Government',
  'Embassy',
  'Corporate',
];