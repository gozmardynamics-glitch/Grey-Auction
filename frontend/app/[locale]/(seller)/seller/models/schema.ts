import * as z from 'zod';

export const personalDetailsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
});

export const businessDetailsSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
});

export const auctionDetailsSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  numberOfItems: z.string().min(1, 'Please select number of items'),
  estimatedValue: z.string().min(1, 'Please select estimated value'),
});

export type PersonalDetailsValues = z.infer<typeof personalDetailsSchema>;
export type BusinessDetailsValues = z.infer<typeof businessDetailsSchema>;
export type AuctionDetailsValues = z.infer<typeof auctionDetailsSchema>;

export type BecomeSellerFormData = PersonalDetailsValues &
  BusinessDetailsValues &
  AuctionDetailsValues;
