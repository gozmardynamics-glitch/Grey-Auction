import { type Auction } from '../../models';

// ---------- Types ----------

// Specification labels carry catalog keys (model-as-keys) resolved via
// admin.auctions.dialogs.specs.* at the render site; unknown labels
// (e.g. real auction data) fall back to their raw value.
export interface SpecificationItem {
  label: string;
  value: string;
}

export interface BidHistoryItem {
  bidder: string;
  bidAmount: number;
  type: string;
  date: string;
  status: 'Winning' | 'Outbid';
}

export interface AuctionDetail extends Auction {
  itemImage?: string;
  sellerReserveNotYetMet?: boolean;
  saleStatus?: string;
  category: string;
  duration?: string;
  startDate?: string;
  endDate: string;
  startingPrice?: number;
  bidIncrement?: number;
  reservePrice?: string;
  reservePriceAmount?: number;
  allowBuyNow?: string;
  buyNowPrice?: number;
  allowInspection?: string;
  inspectionDuration?: string;
  inspectionAddress?: string;
  seller: string;
  sellerEmail?: string;
  sellerVerified?: boolean;
  sellerLocation?: string;
  sellerPhone?: string;
  sellerAvatar?: string;
  productImages?: string[];
  specifications?: SpecificationItem[];
  description?: string;
  descriptionMechanical?: string[];
  additionalInfo?: string;
  additionalInfoMechanical?: string[];
  bidHistory?: BidHistoryItem[];
  totalBids?: number;
}

// ---------- Constants ----------

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);

// ---------- Dummy data ----------

export const DUMMY_SPECS: SpecificationItem[] = [
  { label: 'body', value: 'SUV' },
  { label: 'drivetrain', value: 'AWD' },
  { label: 'gearbox', value: 'Gearbox Pumped Drive' },
  { label: 'displacement', value: 'Multi Video Climate/Heated' },
  { label: 'antique', value: 'Gold' },
  { label: 'color', value: 'Black' },
  { label: 'doorCount', value: '4 drs' },
  { label: 'cubicCapacity', value: '4.8' },
  { label: 'emissionClass', value: '3' },
  { label: 'gearbox', value: 'Automatic' },
  { label: 'mileage', value: '120000mi' },
  { label: 'seatCount', value: '5' },
  { label: 'parkingSensors', value: 'Front, Rear also Options' },
  { label: 'power', value: '5.0l kc' },
];

export const DUMMY_DESCRIPTION =
  'Introducing the Audi RSQ8, a masterpiece in automotive engineering, featuring pioneering innovations and a sophisticated design. This powerhouse combines ultra-high performance and speed with unrivalled attention to detail, offering a touch of perfection to the road. The aerodynamic profile is both an engineering feat and a design triumph. The advanced twin-turbo V8 engine delivers a breathtaking 591 horsepower, making the RSQ8 one of the fastest production SUVs available.';

export const DUMMY_MECHANICAL = [
  'Fuel Safe 22 gallon fuel cell',
  'Ron Davis 4 core radiator',
  'Lifeline fire system with fire suppression and differential',
  'Power rack and roll power steering',
  'Power assisted rack and pin steering',
  'KRC power steering cooler',
  'KRC steering pump',
];

export const DUMMY_BID_HISTORY: BidHistoryItem[] = [
  {
    bidder: 'May S.',
    bidAmount: 80000000,
    type: 'Automatic',
    date: '01-01-2026 • 1:30 PM',
    status: 'Winning',
  },
  {
    bidder: 'Marcel B.',
    bidAmount: 65000000,
    type: 'Automatic',
    date: '01-01-2026 • 2:30 PM',
    status: 'Outbid',
  },
  {
    bidder: 'Tobi A.',
    bidAmount: 60000000,
    type: 'Automatic',
    date: '01-01-2026 • 2:56 PM',
    status: 'Outbid',
  },
];
