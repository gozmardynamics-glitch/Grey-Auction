// ─── Constants ───────────────────────────────────────────────────────────

const CURRENT_USER_ID = 'seller-1';
const PAGE_SIZE = 10;

// ─── Listing ─────────────────────────────────────────────────────────────

type ListingStatus = 'Active' | 'Pending' | 'Ending Soon' | 'Closed';

interface Listing {
  lotId: string;
  item: string;
  itemImage?: string;
  reservePrice: string | boolean;
  startingBid: number;
  currentBid: number | null;
  bids: number | null;
  date: string;
  timeLeft: string;
  status: ListingStatus;
}

interface Specification {
  label: string;
  value: string;
}

interface AuctionDetailsData {
  productName: string;
  category: string;
  subCategory: string;
  tags: string[];
  description: string;
  specifications: {
    body: string;
    airbags: string;
    emissionClass: string;
    climatisation: string;
    color: string;
    gearbox: string;
    doorCount: string;
    cubicCapacity: string;
    mileage: string;
    parkingSensors: string;
    power: string;
  };
}

interface LotAndInventoryData {
  lot: string;
  inventory: number;
  imagePreviews: string[];
  documentPreviews: string[];
}

type AuctionDuration =
  | '1 day'
  | '3 days'
  | '7 days'
  | '14 days'
  | '27 days'
  | '1 month'
  | '2 months'
  | '3 months';

type InspectionDuration = '1 day' | '3 days' | '7 days';

type AuctionType = 'timed' | 'live';

type TimezoneOption = {
  value: string;
  label: string;
};

interface PricingAndTermsData {
  startingPrice: string;
  bidIncrement: string;
  paymentTerms: string;
  hasReservePrice: boolean;
  reservePrice: string;
  reservePriceVisibility: 'hidden' | 'exposed';
  allowBuyNow: boolean;
  buyNowPrice: string;
  auctionDuration: AuctionDuration;
  allowInspection: boolean;
  inspectionAddress: string;
  inspectionDuration: InspectionDuration;
  auctionStartDate?: string;
  timezone?: string;
  auctionType?: AuctionType;
  // U5: seller-set minimum bid increment + escrow window (fixed at creation)
  minBidIncrement?: string;
  escrowReleaseHours?: number;
}

interface CreateListingFormData {
  auctionDetails: AuctionDetailsData;
  lotAndInventory: LotAndInventoryData;
  pricingAndTerms: PricingAndTermsData;
}

const STEPS = [
  { number: 1, label: 'Auction Details' },
  { number: 2, label: 'Lot & Inventory' },
  { number: 3, label: 'Pricing & Terms' },
  { number: 4, label: 'Review' },
] as const;

const CATEGORIES = [
  'Transport and Logistics',
  'Electronics',
  'Art and Collectibles',
  'Fashion',
  'Construction',
  'Agriculture',
  'Government',
  'Embassy',
  'Corporate',
  'Private Room',
] as const;

const SUB_CATEGORIES: Record<string, string[]> = {
  'Transport and Logistics': [
    'Car',
    'Truck',
    'Motorcycle',
    'Boat',
    'Bus',
    'Spare Parts',
  ],
  Electronics: ['Phones', 'Laptops', 'Cameras', 'Audio', 'TV & Displays'],
  'Art and Collectibles': [
    'Paintings',
    'Sculptures',
    'Antiques',
    'Coins',
    'Stamps',
  ],
  Fashion: ['Watches', 'Jewelry', 'Bags', 'Clothing', 'Shoes'],
  Construction: ['Heavy Equipment', 'Tools', 'Materials', 'Vehicles'],
  Agriculture: ['Tractors', 'Harvesters', 'Land', 'Livestock', 'Seeds'],
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
  'Private Room': ['Members Only'],
};

const AUCTION_DURATIONS: AuctionDuration[] = [
  '1 day',
  '3 days',
  '7 days',
  '14 days',
  '27 days',
  '1 month',
  '2 months',
  '3 months',
];

const INSPECTION_DURATIONS: InspectionDuration[] = [
  '1 day',
  '3 days',
  '7 days',
];

const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'Africa/Lagos', label: 'West Africa Time (WAT, UTC+1)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET, UTC-5)' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET, UTC+1)' },
];

const AUCTION_TYPE_OPTIONS: { value: AuctionType; label: string; description: string }[] = [
  { value: 'timed', label: 'Timed Auction', description: 'Fixed end time' },
  { value: 'live', label: 'Live Auction', description: 'Requires bidding room + real-time' },
];

const DEFAULT_FORM_DATA: CreateListingFormData = {
  auctionDetails: {
    productName: '',
    category: '',
    subCategory: '',
    tags: [],
    description: '',
    specifications: {
      body: '',
      airbags: '',
      emissionClass: '',
      climatisation: '',
      color: '',
      gearbox: '',
      doorCount: '',
      cubicCapacity: '',
      mileage: '',
      parkingSensors: '',
      power: '',
    },
  },
  lotAndInventory: {
    lot: '',
    inventory: 1,
    imagePreviews: [],
    documentPreviews: [],
  },
  pricingAndTerms: {
    startingPrice: '',
    bidIncrement: '',
    paymentTerms:
      'Payment are held in escrow until inspection is completed. Payment are held in escrow until inspection is completed. Payment are held in escrow until inspection is completed. Payment are held in escrow until inspection is completed. Payment are held in escrow until inspection is completed. ',
    hasReservePrice: false,
    reservePrice: '',
    reservePriceVisibility: 'hidden',
    allowBuyNow: false,
    buyNowPrice: '',
    auctionDuration: '7 days',
    allowInspection: true,
    inspectionAddress: '',
    inspectionDuration: '3 days',
    auctionStartDate: '',
    timezone: 'Africa/Lagos',
    auctionType: 'timed',
    minBidIncrement: '',
    escrowReleaseHours: 72,
  },
};

const specFields: {
  key: keyof AuctionDetailsData['specifications'];
  label: string;
}[] = [
  { key: 'body', label: 'Body' },
  { key: 'airbags', label: 'Airbags' },
  { key: 'emissionClass', label: 'Emission Class' },
  { key: 'climatisation', label: 'Climatisation' },
  { key: 'color', label: 'Color' },
  { key: 'gearbox', label: 'Gearbox' },
  { key: 'doorCount', label: 'Door Count' },
  { key: 'cubicCapacity', label: 'Cubic Capacity' },
  { key: 'mileage', label: 'Mileage' },
  { key: 'parkingSensors', label: 'Parking sensors' },
  { key: 'power', label: 'Power' },
];

const DUMMY_LISTINGS: Listing[] = [
  {
    lotId: 'LOT-1001',
    item: '2023 Mercedes-Benz GLE 450',
    itemImage: '/car.svg',
    reservePrice: 'Yes',
    startingBid: 32_000_000,
    currentBid: 38_500_000,
    bids: 12,
    date: '10-01-2026',
    timeLeft: '2d 14h 30m',
    status: 'Active',
  },
  {
    lotId: 'LOT-1002',
    item: 'Toyota Land Cruiser 2022',
    itemImage: '/car.svg',
    reservePrice: 'Yes',
    startingBid: 45_000_000,
    currentBid: 52_000_000,
    bids: 18,
    date: '08-01-2026',
    timeLeft: '1d 06h 15m',
    status: 'Ending Soon',
  },
  {
    lotId: 'LOT-1003',
    item: 'BMW X5 xDrive40i 2024',
    itemImage: '/car.svg',
    reservePrice: 'No',
    startingBid: 28_000_000,
    currentBid: 31_200_000,
    bids: 9,
    date: '12-01-2026',
    timeLeft: '5d 08h 45m',
    status: 'Active',
  },
  {
    lotId: 'LOT-1004',
    item: 'Audi RS Q8 Performance',
    itemImage: '/car.svg',
    reservePrice: 'Yes',
    startingBid: 55_000_000,
    currentBid: null,
    bids: 0,
    date: '14-01-2026',
    timeLeft: '7d 00h 00m',
    status: 'Pending',
  },
  {
    lotId: 'LOT-1005',
    item: 'Range Rover Sport 2023',
    itemImage: '/car.svg',
    reservePrice: 'Yes',
    startingBid: 42_000_000,
    currentBid: 48_750_000,
    bids: 15,
    date: '05-01-2026',
    timeLeft: '00h 00m 00s',
    status: 'Closed',
  },
  {
    lotId: 'LOT-1006',
    item: 'Ford Mustang GT 2024',
    itemImage: '/car.svg',
    reservePrice: 'No',
    startingBid: 22_000_000,
    currentBid: 26_800_000,
    bids: 11,
    date: '11-01-2026',
    timeLeft: '3d 19h 10m',
    status: 'Active',
  },
  {
    lotId: 'LOT-1007',
    item: 'Lexus LX 600 2023',
    itemImage: '/car.svg',
    reservePrice: 'Yes',
    startingBid: 60_000_000,
    currentBid: 63_000_000,
    bids: 5,
    date: '09-01-2026',
    timeLeft: '0d 04h 22m',
    status: 'Ending Soon',
  },
  {
    lotId: 'LOT-1008',
    item: 'Porsche Cayenne Turbo 2024',
    itemImage: '/car.svg',
    reservePrice: 'Yes',
    startingBid: 70_000_000,
    currentBid: null,
    bids: null,
    date: '15-01-2026',
    timeLeft: '10d 12h 00m',
    status: 'Pending',
  },
  {
    lotId: 'LOT-1009',
    item: 'Honda Accord 2023 Touring',
    itemImage: '/car.svg',
    reservePrice: 'No',
    startingBid: 15_000_000,
    currentBid: 18_200_000,
    bids: 22,
    date: '03-01-2026',
    timeLeft: '00h 00m 00s',
    status: 'Closed',
  },
  {
    lotId: 'LOT-1010',
    item: 'Volkswagen Tiguan R-Line 2024',
    itemImage: '/car.svg',
    reservePrice: 'No',
    startingBid: 18_500_000,
    currentBid: 21_000_000,
    bids: 7,
    date: '13-01-2026',
    timeLeft: '6d 02h 55m',
    status: 'Active',
  },
  {
    lotId: 'LOT-1011',
    item: 'Chevrolet Tahoe Premier 2023',
    itemImage: '/car.svg',
    reservePrice: 'Yes',
    startingBid: 35_000_000,
    currentBid: 37_500_000,
    bids: 4,
    date: '07-01-2026',
    timeLeft: '1d 11h 40m',
    status: 'Ending Soon',
  },
  {
    lotId: 'LOT-1012',
    item: 'Hyundai Tucson Limited 2024',
    itemImage: '/car.svg',
    reservePrice: 'No',
    startingBid: 14_000_000,
    currentBid: 16_300_000,
    bids: 13,
    date: '06-01-2026',
    timeLeft: '00h 00m 00s',
    status: 'Closed',
  },
];

// ─── Sale ────────────────────────────────────────────────────────────────

type SaleStatus = 'Pending' | 'Paid' | 'Cancelled';
type SaleType = 'Buy Now' | 'Auction';

interface Sale {
  id: string;
  saleId: string;
  item: {
    name: string;
    image: string;
  };
  buyer: {
    name: string;
    location: string;
    phone: string;
    avatar: string;
  };
  type: SaleType;
  price: number;
  date: string;
  status: SaleStatus;
}

const DUMMY_SALES: Sale[] = Array.from({ length: 64 }, (_, i) => ({
  id: `sale-${i + 1}`,
  saleId: 'SAL-123',
  item: {
    name: 'Audi RS08 Performance',
    image: '/car.svg',
  },
  buyer: {
    name: 'Mayowa Adewale',
    location: 'Lagos, Nigeria',
    phone: '+2348143601064',
    avatar: '',
  },
  type: (['Buy Now', 'Auction'] as SaleType[])[i % 2],
  price: 40_000_000,
  date: '10-01-2026 • 11:23 AM',
  status: (['Pending', 'Paid', 'Cancelled'] as SaleStatus[])[i % 3],
}));

// ─── Bid ─────────────────────────────────────────────────────────────────

type BidStatus = 'Winning' | 'Outbid';
type BidType = 'Maximum' | 'Monster';
type BidHistoryStatus = 'Winning' | 'Denied' | 'Outbid';

interface AuctionBidHistory {
  bidder: string;
  amount: number;
  type: BidType;
  date: string;
  status: BidStatus;
}

interface BidHistoryItem {
  id: string;
  amount: number;
  type: 'Maximum' | 'Minimum' | 'Automatic';
  date: string;
  status: BidHistoryStatus;
}

// ─── Bidding Room ────────────────────────────────────────────────────────

type BiddingRoomStatus = 'Active' | 'Pending' | 'Closed';

interface BiddingRoomParticipant {
  id: string;
  name: string;
  avatar: string;
}

interface BiddingRoomAuction {
  id: string;
  auctionNumber: string;
  name: string;
  image: string;
  currentBid: number;
  status: 'Active' | 'Sold';
  reserveStatus: string;
  bids: number;
  auctionEnds: string;
  startingPrice: number;
  bidIncrement: number;
  reservePrice: boolean;
  reservePriceAmount: number;
  allowBuyNow: boolean;
  buyNowPrice: number;
  bidHistory: AuctionBidHistory[];
}

interface BiddingRoom {
  id: string;
  roomId: string;
  roomName: string;
  roomImage: string;
  items: number;
  bidders: number;
  date: string;
  status: BiddingRoomStatus;
  type?: 'public' | 'private';
  roomType?: 'public' | 'private';
  requiresDeposit?: boolean;
  depositAmount?: number;
  allowInviteCode?: boolean;
  inviteCode?: string;
  participants: BiddingRoomParticipant[];
  auctions: BiddingRoomAuction[];
}

const PARTICIPANT_NAMES = [
  'Jayden Nicholas',
  'Mayowa Adewale',
  'Chinedu Okafor',
  'David Mensah',
  'Fatima Abubakar',
  'Oluseun Kareem',
  'Amina Ibrahim',
  'Tunde Bakare',
  'Kemi Adeola',
  'Emeka Nwosu',
  'Aisha Mohammed',
  'Samuel Osei',
  'Ngozi Eze',
  'Kofi Asante',
];

const DUMMY_BIDDING_ROOMS: BiddingRoom[] = Array.from(
  { length: 24 },
  (_, i) => ({
    id: `room-${i + 1}`,
    roomId: `RM-${1234 + i}`,
    roomName: [
      'Exotic Cars',
      'Luxury Watches',
      'Art Collection',
      'Electronics',
    ][i % 4],
    roomImage: '/car.svg',
    items: [15, 8, 12, 20][i % 4],
    bidders: [12, 6, 9, 14][i % 4],
    date: '10-01-2026 • 11:23 AM',
    status: (['Active', 'Pending', 'Active', 'Closed'] as BiddingRoomStatus[])[
      i % 4
    ],
    participants: PARTICIPANT_NAMES.slice(0, [12, 6, 9, 14][i % 4]).map(
      (name, j) => ({
        id: `participant-${j + 1}`,
        name,
        avatar: '',
      })
    ),
    auctions: Array.from({ length: [15, 8, 12, 20][i % 4] }, (_, k) => ({
      id: `auction-${i}-${k + 1}`,
      auctionNumber: `#${25896742 + k}`,
      name: [
        'Audi RSQ8 Performance 2025 | 02-52-97',
        'Mercedes-Benz GLE 450 2024 | 03-41-88',
        'Toyota Land Cruiser 2022 | 01-23-45',
        'BMW X5 xDrive40i 2024 | 04-67-12',
        'Range Rover Sport 2023 | 05-89-34',
      ][k % 5],
      image: '/car.svg',
      currentBid: [35_000_000, 38_500_000, 52_000_000, 31_200_000, 48_750_000][
        k % 5
      ],
      status: (['Active', 'Sold'] as const)[k % 2],
      reserveStatus: k % 2 === 0 ? 'Seller Reserve Not Yet Met' : 'Reserve Met',
      bids: [5, 12, 18, 9, 15][k % 5],
      auctionEnds: 'January 7, 2026',
      startingPrice: [
        35_000_000, 32_000_000, 45_000_000, 28_000_000, 42_000_000,
      ][k % 5],
      bidIncrement: 1_000_000,
      reservePrice: true,
      reservePriceAmount: [
        40_000_000, 42_000_000, 55_000_000, 35_000_000, 50_000_000,
      ][k % 5],
      allowBuyNow: true,
      buyNowPrice: [40_000_000, 45_000_000, 60_000_000, 38_000_000, 55_000_000][
        k % 5
      ],
      bidHistory: Array.from({ length: [5, 12, 18, 9, 15][k % 5] }, (_, b) => ({
        bidder: `B${12345 + b}`,
        amount: [38_000_000, 37_000_000, 36_000_000, 35_000_000][b % 4],
        type: (['Maximum', 'Monster'] as const)[b % 2],
        date: '12-01-2026 • 2:18 PM',
        status: (b === 0 ? 'Winning' : 'Outbid') as BidStatus,
      })),
    })),
  })
);

// ─── Message / Conversation ──────────────────────────────────────────────

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image';
  imageUrl?: string;
}

interface Conversation {
  id: string;
  contact: {
    name: string;
    avatar: string;
    email: string;
    phone: string;
    location: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  messages: Message[];
  sharedMedia: string[];
}

const DUMMY_CONVERSATIONS: Conversation[] = Array.from(
  { length: 12 },
  (_, i) => ({
    id: `conv-${i + 1}`,
    contact: {
      name: 'Jayden Nicholas',
      avatar: '',
      email: 'jaydennicholas@gmail.com',
      phone: '+2348143601064',
      location: 'Lagos, Nigeria',
    },
    lastMessage: 'I would like to make more in...',
    lastMessageTime:
      i < 2
        ? '2 mins'
        : i < 3
          ? '5 hours'
          : i < 4
            ? '7 hours'
            : i < 8
              ? 'Yesterday'
              : 'Jan 1',
    unread: i === 1 || (i >= 5 && i <= 9),
    messages: [
      {
        id: `msg-${i}-1`,
        senderId: `buyer-${i}`,
        content:
          'I would like to make more inquiry about the car you posted for auction.',
        timestamp: '1 min',
        type: 'text' as const,
      },
      {
        id: `msg-${i}-2`,
        senderId: CURRENT_USER_ID,
        content: 'Hello, Jayden. How may I help you?',
        timestamp: '1 min',
        type: 'text' as const,
      },
      {
        id: `msg-${i}-3`,
        senderId: CURRENT_USER_ID,
        content: '',
        timestamp: '1 min',
        type: 'image' as const,
        imageUrl: '/car.svg',
      },
    ],
    sharedMedia: Array.from({ length: 8 }, () => '/car.svg'),
  })
);

// ─── Exports ─────────────────────────────────────────────────────────────

export type {
  // Listing
  Listing,
  ListingStatus,
  Specification,
  AuctionDetailsData,
  LotAndInventoryData,
  PricingAndTermsData,
  CreateListingFormData,
  AuctionDuration,
  InspectionDuration,
  AuctionType,
  TimezoneOption,
  // Sale
  Sale,
  SaleStatus,
  SaleType,
  // Bid
  BidHistoryItem,
  BidHistoryStatus,
  AuctionBidHistory,
  BidStatus,
  BidType,
  // Bidding Room
  BiddingRoom,
  BiddingRoomStatus,
  BiddingRoomParticipant,
  BiddingRoomAuction,
  // Message / Conversation
  Message,
  Conversation,
};

export {
  // Constants
  CURRENT_USER_ID,
  PAGE_SIZE,
  // Listing
  STEPS,
  CATEGORIES,
  SUB_CATEGORIES,
  AUCTION_DURATIONS,
  INSPECTION_DURATIONS,
  TIMEZONE_OPTIONS,
  AUCTION_TYPE_OPTIONS,
  DEFAULT_FORM_DATA,
  specFields,
  DUMMY_LISTINGS,
  // Sale
  DUMMY_SALES,
  // Bidding Room
  DUMMY_BIDDING_ROOMS,
  // Message / Conversation
  DUMMY_CONVERSATIONS,
};