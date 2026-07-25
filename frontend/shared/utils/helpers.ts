import { TimeRemaining } from '@/app/[locale]/(website)/models';
import { subYears } from 'date-fns';
import {
  Briefcase,
  Crown,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Star,
  User,
  Zap,
} from 'lucide-react';

const isLessThan18 = (date: Date) => {
  const eighteenYearsAgo = subYears(new Date(), 18);
  return date > eighteenYearsAgo;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatCurrency2 = (value: string) => {
  if (!value) return '—';
  const num = Number(value.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return value;
  return `₦${num.toLocaleString()}`;
};

const formatYAxis = (value: number) => {
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}K`;
  return value.toString();
};

const calculateTimeRemaining = (endTime: Date): TimeRemaining => {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const difference = end - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
};

const convertBase64ToFile = (
  base64String: string,
  filename: string,
  mimeType: string
): File => {
  const base64Data = base64String.replace(/^data:[^,]+,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const file = new File([blob], filename, {
    type: mimeType,
    lastModified: Date.now(),
  });
  return file;
};

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

function formatTextDate(date: Date | string): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'No Date Set';
  const day = d.getDate();
  const monthIndex = d.getMonth();
  const year = d.getFullYear();
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  function getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  return `${getOrdinal(day)} ${months[monthIndex]}, ${year}`;
}

const formatCardNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
};

// ---------- Timeline Step Colors ----------

type TimelineStepStatus = 'completed' | 'pending' | 'failed';

const stepColors: Record<
  TimelineStepStatus,
  { bg: string; border: string; line: string }
> = {
  completed: {
    bg: 'bg-tertiary text-primary-foreground',
    border: '',
    line: 'bg-tertiary',
  },
  pending: {
    bg: 'bg-yellow-500 text-primary-foreground',
    border: '',
    line: 'bg-yellow-300',
  },
  failed: {
    bg: 'bg-red-500 text-primary-foreground',
    border: '',
    line: 'bg-red-300',
  },
};

// ---------- Wallet Payment Type Styles ----------

const typeClassName: Record<string, string> = {
  Deposit: 'bg-tertiary/10 text-tertiary-1 border-tertiary/20',
  Withdraw: 'bg-blue-100 text-blue-700 border-blue-200',
};

// ---------- Receipt Status Config ----------

type ReceiptStatus = 'Completed' | 'Pending' | 'Failed';

const statusConfig: Record<
  ReceiptStatus,
  { label: string; className: string }
> = {
  Completed: {
    label: 'Successful',
    className: 'bg-tertiary/10 text-tertiary-1 border-tertiary/20',
  },
  Pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  Failed: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

// ---------- Status Styles ----------

const statusStyles: Record<string, string> = {
  // Success (tertiary)
  Active: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  Approved: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  Verified: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  Completed: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  Successful: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  Won: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  Winning: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  Paid: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  Accepted: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  Resolved: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  Success: 'bg-tertiary/10 text-tertiary border-tertiary/20',

  // Warning (yellow)
  Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Inactive: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Ending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Ending Soon': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Unpaid: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Retry: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',

  // Error (red)
  Failed: 'bg-red-100 text-red-700 border-red-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
  Suspended: 'bg-red-100 text-red-700 border-red-200',
  Expired: 'bg-red-100 text-red-700 border-red-200',
  Cancelled: 'bg-red-100 text-red-700 border-red-200',
  Outbid: 'bg-red-100 text-red-700 border-red-200',
  Lost: 'bg-red-100 text-red-700 border-red-200',
  Closed: 'bg-red-100 text-red-700 border-red-200',
  Denied: 'bg-red-100 text-red-700 border-red-200',
  Declined: 'bg-red-100 text-red-700 border-red-200',
  Unverified: 'bg-red-100 text-red-700 border-red-200',
  Sold: 'bg-red-100 text-red-700 border-red-200',
  Blocked: 'bg-red-100 text-red-700 border-red-200',
  Overdue: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-red-100 text-red-700 border-red-200',

  // Info (blue)
  Watching: 'bg-blue-100 text-blue-700 border-blue-200',
  Refunded: 'bg-blue-100 text-blue-700 border-blue-200',
  Review: 'bg-blue-100 text-blue-700 border-blue-200',
  Low: 'bg-blue-100 text-blue-700 border-blue-200',

  // Neutral (gray)
  Ended: 'bg-gray-100 text-gray-700 border-gray-200',

  // Alert (orange)
  Flagged: 'bg-orange-100 text-orange-700 border-orange-200',

  //Plan Package
  Free: 'bg-blue-100 text-blue-700 border-blue-200',
  Pro: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Premiun: 'bg-black-100 text-primary-foreground-700 border-black-200',
};

// ---------- Badge Icon Maps ----------

const sellerTypeIcons: Record<string, React.ElementType> = {
  Business: Briefcase,
  Individual: User,
};

const verificationStatusIcons: Record<string, React.ElementType> = {
  Verified: ShieldCheck,
  Pending: ShieldAlert,
  Unverified: ShieldX,
};

const planPackageIcons: Record<string, React.ElementType> = {
  Free: Zap,
  Pro: Star,
  Premium: Crown,
};

export {
  isLessThan18,
  convertFileToBase64,
  convertBase64ToFile,
  formatTextDate,
  formatCurrency,
  calculateTimeRemaining,
  formatCardNumber,
  formatExpiry,
  formatCurrency2,
  formatYAxis,
  stepColors,
  typeClassName,
  statusConfig,
  statusStyles,
  sellerTypeIcons,
  verificationStatusIcons,
  planPackageIcons,
};

export type { TimelineStepStatus, ReceiptStatus };
