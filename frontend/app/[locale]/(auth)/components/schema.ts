import * as z from 'zod';

// ─── Auth Schemas ────────────────────────────────────────────────────

// export const sellerRegisterSchema = z.object({
//   account_type: z
//     .enum(['individual', 'business'])
//     .refine((val) => val !== undefined, {
//       message: 'Please select an account type',
//     }),
//   first_name: z.string().min(1, 'First name is required'),
//   last_name: z.string().min(1, 'Last name is required'),
//   email: z
//     .string()
//     .min(1, 'Email is required')
//     .email('Please enter a valid email address'),
//   password: z
//     .string()
//     .min(1, 'Password is required')
//     .min(8, 'Password must be at least 8 characters'),
// });

// export const buyerRegisterSchema = z.object({
//   first_name: z.string().min(1, 'First name is required'),
//   last_name: z.string().min(1, 'Last name is required'),
//   email: z
//     .string()
//     .min(1, 'Email is required')
//     .email('Please enter a valid email address'),
//   password: z
//     .string()
//     .min(1, 'Password is required')
//     .min(8, 'Password must be at least 8 characters'),
// });

// export const resetPasswordSchema = z.object({
//   password: z
//     .string()
//     .min(1, 'Password is required')
//     .min(8, 'Password must be at least 8 characters'),
//   confirm_password: z
//     .string()
//     .min(1, 'Password is required')
//     .min(8, 'Password must be at least 8 characters'),
// });

// export const loginSchema = z.object({
//   email: z
//     .string()
//     .min(1, 'Email is required')
//     .email('Please enter a valid email address'),
//   password: z
//     .string()
//     .min(1, 'Password is required')
//     .min(8, 'Password must be at least 8 characters'),
// });

// export const forgotPasswordSchema = z.object({
//   email: z
//     .string()
//     .min(1, 'Email is required')
//     .email('Please enter a valid email address'),
// });

// export const sellerCompleteProfileSchema = z.object({
//   phone: z.string().min(1, 'Phone number is required'),
//   address: z.string().min(1, 'Address is required'),
//   country: z.string().min(1, 'Country is required'),
//   state: z.string().min(1, 'State is required'),
//   city: z.string().min(1, 'City is required'),
// });

// export const verificationSchema = z.object({
//   meansOfId: z.string().min(1, 'Please select a means of ID'),
//   file: z
//     .instanceof(File)
//     .refine(
//       (file) => file.size <= 5 * 1024 * 1024,
//       'File size must be less than 5MB'
//     )
//     .refine(
//       (file) =>
//         ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type),
//       'Only JPEG, PNG and PDF files are accepted'
//     )
//     .optional(),
// });

// export const checkoutSchema = z.object({
//   firstName: z.string().min(1, 'First name is required'),
//   lastName: z.string().min(1, 'Last name is required'),
//   phoneCode: z.string(),
//   phone: z.string().min(1, 'Phone number is required'),
//   email: z.string().email('Invalid email address'),
//   country: z.string().min(1, 'Country is required'),
//   houseNumber: z.string().min(1, 'House number is required'),
//   street: z.string().min(1, 'Street is required'),
//   state: z.string().min(1, 'State is required'),
//   city: z.string().min(1, 'City is required'),
//   postalCode: z.string().min(1, 'Postal code is required'),
//   shipToDifferent: z.boolean(),
//   shipFirstName: z.string().optional(),
//   shipLastName: z.string().optional(),
//   shipCountry: z.string().optional(),
//   shipHouseNumber: z.string().optional(),
//   shipStreet: z.string().optional(),
//   shipState: z.string().optional(),
//   shipCity: z.string().optional(),
//   shipPostalCode: z.string().optional(),
//   agreedToTerms: z.literal(true, {
//     error: () => ({ message: 'You must agree to the terms' }),
//   }),
// });

// export const paymentSchema = z.object({
//   cardNumber: z
//     .string()
//     .min(1, 'Card number is required')
//     .regex(/^[\d\s]{13,19}$/, 'Invalid card number'),
//   expiry: z
//     .string()
//     .min(1, 'Expiry is required')
//     .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format'),
//   cvv: z
//     .string()
//     .min(1, 'CVV is required')
//     .regex(/^\d{3,4}$/, 'Invalid CVV'),
//   agreedToTerms: z.literal(true, {
//     error: () => ({ message: 'You must agree to the terms' }),
//   }),
// });
//
// export const completeProfileSchema = z.object({
//   phoneNumber: z.string().min(1, 'Phone number is required'),
//   country: z.string().min(1, 'Country is required'),
//   streetAddress: z.string().min(1, 'Street address is required'),
//   state: z.string().min(1, 'State is required'),
//   city: z.string().min(1, 'City is required'),
// });

// ─── Version 3: Real validation (restored) ─────────────────────────

const emailRule = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');
const passwordRule = z
  .string()
  .min(1, 'Password is required')
  .min(6, 'Password must be at least 6 characters');

export const sellerRegisterSchema = z.object({
  account_type: z.enum(['individual', 'business']),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: emailRule,
  password: passwordRule,
});

export const buyerRegisterSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: emailRule,
  password: passwordRule,
});

export const resetPasswordSchema = z
  .object({
    password: passwordRule,
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailRule,
});

export const verificationSchema = z.object({
  meansOfId: z.string().min(1, 'Please select a means of ID'),
  file: z.any().optional(),
});

export const checkoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneCode: z.string().min(1, 'Phone code is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: emailRule,
  country: z.string().min(1, 'Country is required'),
  houseNumber: z.string().min(1, 'House number is required'),
  street: z.string().min(1, 'Street is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  shipToDifferent: z.boolean().optional(),
  shipFirstName: z.string().optional(),
  shipLastName: z.string().optional(),
  shipCountry: z.string().optional(),
  shipHouseNumber: z.string().optional(),
  shipStreet: z.string().optional(),
  shipState: z.string().optional(),
  shipCity: z.string().optional(),
  shipPostalCode: z.string().optional(),
  agreedToTerms: z
    .boolean()
    .refine((v) => v === true, 'You must agree to the terms and conditions'),
});

export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^[\d\s]{13,19}$/, 'Invalid card number'),
  expiry: z
    .string()
    .min(1, 'Expiry is required')
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format'),
  cvv: z
    .string()
    .min(1, 'CVV is required')
    .regex(/^\d{3,4}$/, 'Invalid CVV'),
  agreedToTerms: z
    .boolean()
    .refine((v) => v === true, 'You must agree to the terms and conditions'),
});

export const completeProfileSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  country: z.string().min(1, 'Country is required'),
  address: z.string().min(1, 'Address is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
});

// ─── Types ───────────────────────────────────────────────────────────
export type PaymentFormValues = z.infer<typeof paymentSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
export type VerificationFormValues = z.infer<typeof verificationSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type SellerRegisterFormValues = z.infer<typeof sellerRegisterSchema>;
export type BuyerRegisterFormValues = z.infer<typeof buyerRegisterSchema>;
export type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;
