import * as z from 'zod';

// ─── Account / Profile ─────────────────────────────────────────────

export const buyerProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phoneCode: z.string().optional(),
  phone: z.string().optional(),
});

export const buyerAddressSchema = z.object({
  country: z.string().optional(),
  streetAddress: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
});

// ─── Security / Authentications ─────────────────────────────────────

export const buyerChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const buyerSecurityOptionsSchema = z.object({
  twoFactorAuth: z.boolean().optional(),
});

// ─── Types ──────────────────────────────────────────────────────────

export type BuyerProfileValues = z.infer<typeof buyerProfileSchema>;
export type BuyerAddressValues = z.infer<typeof buyerAddressSchema>;
export type BuyerChangePasswordValues = z.infer<typeof buyerChangePasswordSchema>;
export type BuyerSecurityOptionsValues = z.infer<typeof buyerSecurityOptionsSchema>;
