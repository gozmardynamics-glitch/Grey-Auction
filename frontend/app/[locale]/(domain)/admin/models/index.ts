// ─── Auction ─────────────────────────────────────────────────────────────

import { TimelineStepStatus } from '@/shared/utils/helpers';
import { PermissionCategory } from '../admins/data/permissions';

type AuctionStatus =
  | 'Active'
  | 'Pending'
  | 'Completed'
  | 'Rejected'
  | 'Flagged';

interface Auction {
  id: string;
  item: string;
  itemImage?: string;
  seller: string;
  category: string;
  startingBid: number;
  currentBid: number;
  bids: number;
  endDate: string;
  status: AuctionStatus;
}

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

interface InvoiceDetail {
  invoiceNumber: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  invoiceSuffix?: string;
  issueDate: string;
  dueDate: string;
  billedTo: string;
  billedDetails: string;
  items: InvoiceItem[];
  subtotal: number;
  auctionFeePercent: number;
  auctionFee: number;
  vatOnBidValue: number;
  satOnAuctionFee: number;
  totalBidAmount: number;
}

interface AuctionActivityItem {
  auctionId: string;
  item: string;
  itemImage?: string;
  category: string;
  duration: string;
  startingBid: number;
  price: number;
  date: string;
  status: 'Active' | 'Completed' | 'Expired';
}

interface AuctionDetail {
  auctionId: string;
  item: string;
  itemImage?: string;
  category: string;
  duration: string;
  startDate: string;
  endDate: string;
  startingPrice: number;
  bidIncrement: number;
  reservePrice: number;
  minimumBidPrice: number;
  allowBuyNow: boolean;
  buyNowPrice: number;
  allowInspection: boolean;
  inspectionDuration: string;
  inspectionAddress: string;
  seller: {
    name: string;
    avatar?: string;
    email: string;
    location: string;
    phone: string;
    verified: boolean;
    sellerType: SellerType;
  };
  bidHistory: BidHistoryItem[];
}

// ─── Bid ─────────────────────────────────────────────────────────────────

type BidStatus = 'Active' | 'Completed' | 'Ending';

interface Bid {
  id: string;
  item: string;
  itemImage?: string;
  bidType: string;
  bidder: string;
  bidAmount: number;
  bidDate: string;
  status: BidStatus;
}

interface BidHistoryItem {
  name: string;
  avatar?: string;
  amount: number;
  timestamp: string;
  status: 'Pending' | 'Accepted' | 'Declined';
}

interface BidActivityItem {
  auctionId: string;
  item: string;
  itemImage?: string;
  bidAmount: number;
  type: string;
  status: 'Won' | 'Outbid' | 'Watching';
  date: string;
}

interface BidDetailHistoryItem {
  bidder: string;
  bidAmount: number;
  type: string;
  date: string;
  status: 'Winning' | 'Outbid';
}

interface BidDetail extends Bid {
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
  bidHistory?: BidDetailHistoryItem[];
  totalBids?: number;
}

// ─── Bidding Room ────────────────────────────────────────────────────────

type BiddingRoomStatus = 'Active' | 'Pending' | 'Completed' | 'Rejected';

interface BiddingRoomParticipant {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  joinedAt: string;
}

interface AuctionBidHistory {
  bidder: string;
  amount: number;
  type: 'Maximum' | 'Monster';
  date: string;
  status: 'Winning' | 'Outbid';
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
  name: string;
  roomImage?: string;
  seller: string;
  sellerAvatar?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerLocation?: string;
  sellerVerified?: boolean;
  auctions: number;
  bidders: number;
  date: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  status: BiddingRoomStatus;
  participants?: BiddingRoomParticipant[];
  auctionsList?: BiddingRoomAuction[];
}

// ─── Seller ──────────────────────────────────────────────────────────────

type SellerStatus = 'Active' | 'Inactive' | 'Suspended';
type SellerType = 'Business' | 'Individual';
type VerificationStatus = 'Verified' | 'Pending' | 'Unverified';
type PlanPackage = 'Free' | 'Pro' | 'Premium';

interface Seller {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  phone: string;
  verified?: boolean;
  sellerType?: SellerType;
  verificationStatus?: VerificationStatus;
  planPackage?: PlanPackage;
  location: string;
  totalListings: number;
  totalSales: number;
  totalRevenue: number;
  joinDate: string;
  status: SellerStatus;
}

interface SellerDetail extends Seller {
  totalAuctions?: number;
  accountBalance?: number;
  lastActive?: string;
  rating?: number;
  phoneNumber?: string;
  dateJoined?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  itemSold?: number;
  totalBids?: number;
  auctionActivity?: AuctionActivityItem[];
  salesActivity?: SaleItem[];
  transactionActivity?: TransactionItem[];
  uploadedDocuments?: UploadedDocument[];
}



interface SellerTransactionDetail {
  amount: number;
  status: 'Successful' | 'Pending' | 'Failed';
  timeline: TimelineStep[];
  billing: {
    to: string;
    paymentMethod: string;
    type: string;
    transactionId: string;
  };
}

interface SaleDetail {
  saleId: string;
  type: 'Voucher' | 'Direct' | 'Auction';
  status: 'Paid' | 'Failed' | 'Refunded';
  item: string;
  itemImage?: string;
  buyer: {
    name: string;
    avatar?: string;
    email: string;
    location: string;
    phone: string;
  };
  totalBid: number;
  auctionFeePercent: number;
  auctionFee: number;
  vatOnBidValue: number;
  vatOnAuctionFee: number;
  totalBidAmount: number;
}

// ─── Buyer ───────────────────────────────────────────────────────────────

type BuyerStatus = 'Active' | 'Inactive' | 'Suspended';

interface Buyer {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  verified?: boolean;
  phone: string;
  location: string;
  totalBids: number;
  totalWins: number;
  totalSpent: number;
  joinDate: string;
  status: BuyerStatus;
}

interface BuyerDetail extends Buyer {
  totalAuctions?: number;
  accountBalance?: number;
  lastActive?: string;
  phoneNumber?: string;
  dateJoined?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  purchases?: number;
  bidActivity?: BidActivityItem[];
  purchaseActivity?: PurchaseItem[];
  transactionActivity?: BuyerTransactionItem[];
}

interface BuyerTransactionItem {
  txnId: string;
  type: 'Refund' | 'Deposit';
  amount: number;
  method: string;
  date: string;
  status: 'Successful' | 'Failed' | 'Retry';
}

// ─── Sale ────────────────────────────────────────────────────────────────

interface SaleItem {
  buyer?: Buyer;
  auctionId: string;
  item: string;
  itemImage?: string;
  timestamp: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

interface PurchaseItem {
  auctionId: string;
  item: string;
  itemImage?: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

// ─── Payment / Transaction ───────────────────────────────────────────────

type PaymentStatus = 'Completed' | 'Pending' | 'Failed' | 'Refunded';
type PaymentMethod = 'Bank Transfer' | 'Card' | 'Escrow' | 'Crypto';
type TransactionType = 'Deposit' | 'Withdraw';

interface Payment {
  id: string;
  item: string;
  itemImage?: string;
  buyer: string;
  seller: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  status: PaymentStatus;
}

interface TransactionDetail extends Payment {
  transactionType: TransactionType;
  buyerId?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  sellerId?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  paymentGateway?: string;
  recipientName?: string;
  transactionId?: string;
}

interface TransactionItem {
  txnId: string;
  type: 'Withdraw' | 'Deposit' | 'Refund';
  amount: number;
  method: string;
  date: string;
  status: 'Successful' | 'Failed' | 'Pending';
}

// ─── Category ────────────────────────────────────────────────────────────

type CategoryStatus = 'Active' | 'Inactive';

interface Category {
  id: string;
  category: string;
  icon?: string;
  parentCategory: string;
  slug: string;
  listings: number;
  specifications?: string[];
  createdAt: string;
  status: CategoryStatus;
}

interface CategoryDetail extends Category {
  description?: string;
}

// ─── Banner ──────────────────────────────────────────────────────────────

type BannerStatus = 'Active' | 'Inactive';

interface Banner {
  id: string;
  title: string;
  image?: string;
  link?: string;
  type?: string;
  visibility: string;
  createdAt: string;
  status: BannerStatus;
}

// ─── FAQ ─────────────────────────────────────────────────────────────────

type FaqStatus = 'Active' | 'Inactive';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  createdAt: string;
  status: FaqStatus;
}

// ─── Admin ───────────────────────────────────────────────────────────────

type AdminStatus = 'Active' | 'Suspended';
type AdminRole = 'Super Admin' | 'Admin' | 'Moderator' | 'Support';

interface Admin {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  phone: string;
  role: AdminRole;
  lastLogin: string;
  joinDate: string;
  status: AdminStatus;
}

interface ActivityLogItem {
  action: string;
  target: string;
  date: string;
  ip?: string;
}

export interface AdminDetail extends Admin {
  permissions?: string[];
  activityLog?: ActivityLogItem[];
  adminPermissions?: PermissionCategory[];
}

// ─── Ticket ─────────────────────────────────────────────────────────────

interface TicketMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image';
  imageUrl?: string;
}

interface Ticket {
  id: string;
  contact: {
    name: string;
    avatar: string;
    email: string;
    phone: string;
    sellerId: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  messages: TicketMessage[];
  sharedMedia: string[];
}


// ---------- Types ----------

interface PaymentHistoryItem {
  action: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

 interface PaymentDetail extends Payment {
  buyerEmail?: string;
  buyerPhone?: string;
  buyerLocation?: string;
  buyerAvatar?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerLocation?: string;
  sellerAvatar?: string;
  sellerVerified?: boolean;
  transactionRef?: string;
  escrowStatus?: string;
  paymentHistory?: PaymentHistoryItem[];
  auctionId?: string;
  bidAmount?: number;
  fees?: number;
  netAmount?: number;
}

// ─── Document ────────────────────────────────────────────────────────────

interface UploadedDocument {
  fileName: string;
  fileUrl?: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}


// ─── Buyer Transaction ────────────────────────────────────────────────────

interface BuyerTimelineStep {
  title: string;
  description: string;
  date: string;
  completed: boolean;
}

interface TimelineStep {
  title: string;
  description: string;
  date: string;
  status: TimelineStepStatus;
}

interface BuyerTransactionDetail {
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  timeline: BuyerTimelineStep[];
  billing: {
    id: string;
    paymentGateway: string;
    payment: string;
    transactionId: string;
    deposit: string;
    title: string;
  };
}
// ─── AI ───────────────────────────────────────────────────────────────────

interface LLMProvider {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  apiKey: string;
  headers?: Record<string, string>;
  isActive: boolean;
  tier: 'production' | 'development' | 'testing';
  models?: LLMModel[];
  createdAt: string;
  updatedAt: string;
}

interface LLMModel {
  id: string;
  modelId: string;
  displayName: string;
  capabilities: string[];
  contextWindow: number;
  maxOutputTokens: number;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  defaultTemperature: number;
  isActive: boolean;
  providerId: string;
  provider?: LLMProvider;
  createdAt: string;
  updatedAt: string;
}

interface AIFeatureConfig {
  id: string;
  featureKey: string;
  section: string;
  displayName: string;
  description?: string;
  isEnabled: boolean;
  quality: 'premium' | 'standard' | 'draft';
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  primaryModel?: LLMModel;
  primaryModelId?: string;
  fallbackModel?: LLMModel;
  fallbackModelId?: string;
  tertiaryModel?: LLMModel;
  tertiaryModelId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AIUsageLog {
  id: string;
  featureKey: string;
  modelId?: string;
  providerName?: string;
  userId?: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  attemptNumber?: number;
  createdAt: string;
}

// ─── Exports ─────────────────────────────────────────────────────────────

export type {
  // Auction
  Auction,
  AuctionActivityItem,
  AuctionDetail,
  AuctionStatus,
  // Bid
  Bid,
  BidHistoryItem,
  BidActivityItem,
  BidDetailHistoryItem,
  BidDetail,
  BidStatus,
  // Bidding Room
  BiddingRoom,
  BiddingRoomParticipant,
  BiddingRoomAuction,
  AuctionBidHistory,
  BiddingRoomStatus,
  // Seller
  Seller,
  SellerDetail,
  SellerStatus,
  SellerType,
  VerificationStatus,
  PlanPackage,
  TimelineStep,
  SellerTransactionDetail,
  SaleDetail,
  // Buyer
  Buyer,
  BuyerDetail,
  BuyerTransactionItem,
  BuyerStatus,
  // Sale
  SaleItem,
  PurchaseItem,
  // Payment / Transaction
  Payment,
  TransactionDetail,
  TransactionItem,
  PaymentStatus,
  PaymentMethod,
  TransactionType,
  // Category
  Category,
  CategoryDetail,
  CategoryStatus,
  // Banner
  Banner,
  BannerStatus,
  // FAQ
  Faq,
  FaqStatus,
  // Admin
  Admin,
  AdminStatus,
  AdminRole,
  // Document
  UploadedDocument,
  // Ticket
  Ticket,
  TicketMessage,
  // Invoice
  InvoiceDetail,
  InvoiceItem,
  // Buyer Transaction
  BuyerTransactionDetail,
  BuyerTimelineStep,
  PaymentDetail,
  PaymentHistoryItem,
  // AI
  LLMProvider,
  LLMModel,
  AIFeatureConfig,
  AIUsageLog,
};

