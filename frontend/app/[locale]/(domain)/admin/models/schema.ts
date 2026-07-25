import * as z from 'zod';

// ─── General Settings ───────────────────────────────────────────────

export const siteConfigSchema = z.object({
  siteName: z.string().optional(),
  siteUrl: z.string().optional(),
  adminEmail: z.string().optional(),
  sitePhone: z.string().optional(),
  copyright: z.string().optional(),
  siteDescription: z.string().optional(),
  allowRegistration: z.enum(['enable', 'invite-only', 'disable']).optional(),
  maintenanceMode: z.boolean().optional(),
});

export const timezoneFormatSchema = z.object({
  timeZone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional(),
});

export const languageSchema = z.object({
  defaultLanguage: z.string().optional(),
  languageSwitcher: z.boolean().optional(),
});

export const countrySchema = z.object({
  countryRestriction: z.string().optional(),
  chooseCountries: z.string().optional(),
});

// ─── Email Settings ─────────────────────────────────────────────────

export const smtpConfigSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpEncryption: z.string().optional(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
});

export const mailingConfigSchema = z.object({
  emailFromName: z.string().optional(),
  emailFromAddress: z.string().optional(),
});

// ─── Auctions Settings ─────────────────────────────────────────────

export const auctionSettingsSchema = z.object({
  minDuration: z.string().optional(),
  maxDuration: z.string().optional(),
  bidIncrement: z.string().optional(),
  autoCloseOnEndTime: z.boolean().optional(),
  autoCloseOnEndTime2: z.boolean().optional(),
});

export const auctionAdvancedSchema = z.object({
  autoRejectUnpaid: z.string().optional(),
});

// ─── Payments Settings ──────────────────────────────────────────────

export const paymentGatewaySchema = z.object({
  provider: z.string().optional(),
  apiClientId: z.string().optional(),
  secretKey: z.string().optional(),
  enabled: z.boolean().optional(),
});

export const withdrawSchema = z.object({
  method: z.string().optional(),
  minWithdraw: z.string().optional(),
  maxWithdraw: z.string().optional(),
  autoApprove: z.boolean().optional(),
});

// ─── Security Settings ──────────────────────────────────────────────

export const authenticationSchema = z.object({
  sessionTimeout: z.string().optional(),
  loginAttempts: z.string().optional(),
  passwordLength: z.string().optional(),
  uppercaseLetterNumber: z.boolean().optional(),
  specialCharacter: z.boolean().optional(),
  twoFactorAuth: z.boolean().optional(),
});

export const securityAdvancedSchema = z.object({
  ipWhitelist: z.boolean().optional(),
  auditLogs: z.boolean().optional(),
  dataEncryption: z.boolean().optional(),
});

// ─── Preferences Settings ───────────────────────────────────────────

export const websitePreferencesSchema = z.object({
  logoSize: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
});

export const appearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

// ─── Terms & Conditions ────────────────────────────────────────────

export const termsAndConditionsSchema = z.object({
  pageTitle: z.string().optional(),
  pageSlug: z.string().optional(),
  seoPageTitle: z.string().optional(),
  seoKeyword: z.string().optional(),
  customPageLink: z.string().optional(),
  pageContent: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const privacyPolicySchema = z.object({
  pageTitle: z.string().optional(),
  pageSlug: z.string().optional(),
  seoPageTitle: z.string().optional(),
  seoKeyword: z.string().optional(),
  customPageLink: z.string().optional(),
  pageContent: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ─── Types ──────────────────────────────────────────────────────────

export type SiteConfigValues = z.infer<typeof siteConfigSchema>;
export type TimezoneFormatValues = z.infer<typeof timezoneFormatSchema>;
export type LanguageValues = z.infer<typeof languageSchema>;
export type CountryValues = z.infer<typeof countrySchema>;
export type SmtpConfigValues = z.infer<typeof smtpConfigSchema>;
export type MailingConfigValues = z.infer<typeof mailingConfigSchema>;
export type AuctionSettingsValues = z.infer<typeof auctionSettingsSchema>;
export type AuctionAdvancedValues = z.infer<typeof auctionAdvancedSchema>;
export type PaymentGatewayValues = z.infer<typeof paymentGatewaySchema>;
export type WithdrawValues = z.infer<typeof withdrawSchema>;
export type AuthenticationValues = z.infer<typeof authenticationSchema>;
export type SecurityAdvancedValues = z.infer<typeof securityAdvancedSchema>;
export type WebsitePreferencesValues = z.infer<typeof websitePreferencesSchema>;
export type AppearanceValues = z.infer<typeof appearanceSchema>;
export type TermsAndConditionsValues = z.infer<typeof termsAndConditionsSchema>;
export type PrivacyPolicyValues = z.infer<typeof privacyPolicySchema>;
