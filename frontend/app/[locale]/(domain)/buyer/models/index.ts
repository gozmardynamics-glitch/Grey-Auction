import { CreditCard, FileText, Heart, Trophy } from 'lucide-react';

// ─── Auction ─────────────────────────────────────────────────────────────

type AuctionStatus = 'Winning' | 'Outbid' | 'Ending Soon';
type BuyerAuctionStatus = 'Won' | 'Lost' | 'Active' | 'Ended';

interface ActiveAuction {
  id: string;
  image: string;
  name: string;
  details: string;
  currentBid: number;
  timeLeft: string;
  status: AuctionStatus;
}

interface AuctionAlert {
  id: string;
  message: string;
  auction: string;
  time: string;
  type: 'outbid' | 'ending' | 'won';
}

interface BuyerAuction {
  id: string;
  item: string;
  seller: string;
  yourBid: number;
  currentBid: number;
  endDate: string;
  status: BuyerAuctionStatus;
}

// ─── Bid ─────────────────────────────────────────────────────────────────

type BidStatus = 'Outbid' | 'Won' | 'Winning' | 'Lost' | 'Ending Soon';

interface MyBid {
  id: string;
  image: string;
  auction: string;
  lot: string;
  currentBid: number;
  yourBid: number;
  time: string;
  status: BidStatus;
}

// ─── Invoice ─────────────────────────────────────────────────────────────

type InvoiceStatus = 'Pending' | 'Paid' | 'Cancelled';

interface PurchaseInvoice {
  id: string;
  invoiceId: string;
  image: string;
  item: string;
  vendor: string;
  amount: number;
  date: string;
  status: InvoiceStatus;
}

interface RecentInvoice {
  id: string;
  image: string;
  item: string;
  vendor: string;
  amount: number;
  date: string;
  status: InvoiceStatus;
}

// ─── Wallet / Payment ────────────────────────────────────────────────────

type PaymentMethodOption = 'bank-transfer' | 'card' | 'direct-debit';
type DepositStep =
  | 'amount'
  | 'card-select'
  | 'bank-account-select'
  | 'confirm'
  | 'success'
  | 'failure'
  | 'direct-debit'
  | 'direct-debit-address'
  | 'direct-debit-confirm'
  | 'direct-debit-success';
type WithdrawStep =
  | 'add-account'
  | 'verify-bank'
  | 'setup-pin'
  | 'verify-pin'
  | 'account-success'
  | 'amount'
  | 'pin'
  | 'review'
  | 'forgot-pin'
  | 'reset-pin'
  | 'reset-pin-success';
type WalletPaymentStatus = 'Completed' | 'Pending' | 'Failed';
type WalletPaymentType = 'Deposit' | 'Withdraw';
type WalletPaymentMethod = 'Card' | 'Wema' | 'Bank Transfer';
type ReceiptStatus = 'Completed' | 'Pending' | 'Failed';
type ReceiptType = 'Deposit' | 'Withdraw';

interface WalletPayment {
  referenceId: string;
  paymentName: string;
  type: WalletPaymentType;
  method: WalletPaymentMethod;
  amount: number;
  date: string;
  status: WalletPaymentStatus;
}

interface ReceiptData {
  type: ReceiptType;
  amount: number;
  status: ReceiptStatus;
  referenceId: string;
  date: string;
  method: string;
  paymentName: string;
  merchantName?: string;
  merchantProvider?: string;
  paymentId?: string;
  winningAmount?: number;
  accountHolder?: string;
  bankInfo?: string;
  withdrawalId?: string;
}

interface BankAccountInfo {
  name: string;
  bankName: string;
  maskedAccount: string;
}

// ─── Wishlist ────────────────────────────────────────────────────────────

interface WishlistItem {
  id: string;
  image: string;
  title: string;
  specs: string;
  currentBid: number;
  maxBid: number;
  countdown: { days: number; hours: number; mins: number };
  badge?: 'New' | 'Live';
  isFavorited?: boolean;
}

// ─── Notification ────────────────────────────────────────────────────────

type NotificationType = 'payment' | 'wishlist' | 'invoice' | 'won';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  date: string;
}

interface NotificationPref {
  label: string;
  key: string;
  enabled: boolean;
}

const typeConfig: Record<
  NotificationType,
  { icon: React.ElementType; className: string }
> = {
  payment: {
    icon: CreditCard,
    className: 'bg-blue-100 text-blue-600',
  },
  wishlist: {
    icon: Heart,
    className: 'bg-tertiary/10 text-green-600',
  },
  invoice: {
    icon: FileText,
    className: 'bg-orange-100 text-orange-600',
  },
  won: {
    icon: Trophy,
    className: 'bg-yellow-100 text-yellow-600',
  },
};

// ─── Message ─────────────────────────────────────────────────────────────

interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  time: string;
  unread: boolean;
}

// ─── Exports ─────────────────────────────────────────────────────────────

export type {
  // Auction
  ActiveAuction,
  AuctionStatus,
  AuctionAlert,
  BuyerAuction,
  BuyerAuctionStatus,
  // Bid
  MyBid,
  BidStatus,
  // Invoice
  PurchaseInvoice,
  RecentInvoice,
  InvoiceStatus,
  // Wallet / Payment
  PaymentMethodOption,
  DepositStep,
  WithdrawStep,
  WalletPayment,
  WalletPaymentStatus,
  WalletPaymentType,
  WalletPaymentMethod,
  ReceiptData,
  ReceiptStatus,
  ReceiptType,
  BankAccountInfo,
  // Wishlist
  WishlistItem,
  // Notification
  Notification,
  NotificationType,
  NotificationPref,
  // Message
  Message,
};

export { typeConfig };
