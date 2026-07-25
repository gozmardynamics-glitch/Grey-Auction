import * as z from 'zod';

// ─── My Profile ────────────────────────────────────────────────────

export const profileInfoSchema = z.object({
  shopName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phoneCode: z.string().optional(),
  phone: z.string().optional(),
});

export const profileAddressSchema = z.object({
  country: z.string().optional(),
  streetAddress: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
});

// ─── Security ──────────────────────────────────────────────────────

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const withdrawalPinSchema = z.object({
  currentPin: z.string().min(4, 'PIN must be 4 digits').max(4),
  newPin: z.string().min(4, 'PIN must be 4 digits').max(4),
  confirmPin: z.string().min(4, 'PIN must be 4 digits').max(4),
}).refine((data) => data.newPin === data.confirmPin, {
  message: 'PINs do not match',
  path: ['confirmPin'],
});

export const securityOptionsSchema = z.object({
  twoFactorAuth: z.boolean().optional(),
});

// ─── Notifications ─────────────────────────────────────────────────

export const notificationsSchema = z.object({
  auction: z.boolean().optional(),
  paymentPayout: z.boolean().optional(),
  messages: z.boolean().optional(),
  systemSecurity: z.boolean().optional(),
});

// ─── Preferences ───────────────────────────────────────────────────

export const languagePreferenceSchema = z.object({
  language: z.string().optional(),
});

export const appearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

// ─── Create Listing ───────────────────────────────────────────────

export const auctionDetailsSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().min(1, 'Sub category is required'),
  tags: z.array(z.string()),
  description: z.string(),
  specifications: z.object({
    body: z.string(),
    airbags: z.string(),
    emissionClass: z.string(),
    climatisation: z.string(),
    color: z.string(),
    gearbox: z.string(),
    doorCount: z.string(),
    cubicCapacity: z.string(),
    mileage: z.string(),
    parkingSensors: z.string(),
    power: z.string(),
  }),
});

export const lotAndInventorySchema = z.object({
  lot: z.string().min(1, 'Lot number is required'),
  inventory: z.number(),
  imagePreviews: z.array(z.string()),
  documentPreviews: z.array(z.string()),
});

export const pricingAndTermsSchema = z.object({
  startingPrice: z.string().min(1, 'Starting price is required'),
  bidIncrement: z.string().min(1, 'Bid increment is required'),
  paymentTerms: z.string(),
  hasReservePrice: z.boolean(),
  reservePrice: z.string(),
  allowBuyNow: z.boolean(),
  buyNowPrice: z.string(),
  auctionDuration: z.enum([
    '1 day', '3 days', '7 days', '14 days', '27 days',
    '1 month', '2 months', '3 months',
  ]),
  allowInspection: z.boolean(),
  inspectionAddress: z.string(),
  inspectionDuration: z.enum(['1 day', '3 days', '7 days']),
}).superRefine((data, ctx) => {
  if (data.hasReservePrice && !data.reservePrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Reserve price is required',
      path: ['reservePrice'],
    });
  }
  if (data.allowBuyNow && !data.buyNowPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Buy now price is required',
      path: ['buyNowPrice'],
    });
  }
  if (data.allowInspection && !data.inspectionAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Inspection address is required',
      path: ['inspectionAddress'],
    });
  }
});

// ─── Types ─────────────────────────────────────────────────────────

export type ProfileInfoValues = z.infer<typeof profileInfoSchema>;
export type ProfileAddressValues = z.infer<typeof profileAddressSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type WithdrawalPinValues = z.infer<typeof withdrawalPinSchema>;
export type SecurityOptionsValues = z.infer<typeof securityOptionsSchema>;
export type NotificationsValues = z.infer<typeof notificationsSchema>;
export type LanguagePreferenceValues = z.infer<typeof languagePreferenceSchema>;
export type AppearanceValues = z.infer<typeof appearanceSchema>;
export type AuctionDetailsValues = z.infer<typeof auctionDetailsSchema>;
export type LotAndInventoryValues = z.infer<typeof lotAndInventorySchema>;
export type PricingAndTermsValues = z.infer<typeof pricingAndTermsSchema>;
