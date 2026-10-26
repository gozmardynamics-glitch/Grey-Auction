import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Settings sections the platform accepts. Each one owns a fixed set of fields
 * (see SETTINGS_SECTION_FIELDS) — the old route took `@Body() dto: any` and
 * stored whatever arrived, so a typo silently wrote a dead key and any shape
 * was accepted.
 */
export const SETTINGS_SECTIONS = [
  'siteConfig',
  'timezone',
  'language',
  'country',
  'smtp',
  'mailing',
  'authentication',
  'advanced',
  'notifications',
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export class SettingsNotificationToggleDto {
  @ApiProperty({ example: 'auction' })
  @IsString()
  @MaxLength(80)
  key: string;

  @ApiPropertyOptional({ example: 'auction' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  labelKey?: string;

  @ApiPropertyOptional({ example: 'auctionHint' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  descriptionKey?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}

export class UpdateSettingsDto {
  /** Optional: the path segment is authoritative; a mismatch is rejected. */
  @ApiPropertyOptional({ enum: SETTINGS_SECTIONS })
  @IsOptional()
  @IsIn(SETTINGS_SECTIONS as unknown as string[])
  section?: SettingsSection;

  // ── general · siteConfig ──
  @IsOptional() @IsString() @MaxLength(120) siteName?: string;
  @IsOptional() @IsString() @MaxLength(300) siteUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) adminEmail?: string;
  @IsOptional() @IsString() @MaxLength(40) sitePhone?: string;
  @IsOptional() @IsString() @MaxLength(200) copyright?: string;
  @IsOptional() @IsString() @MaxLength(1000) siteDescription?: string;
  @IsOptional() @IsIn(['enable', 'invite-only', 'disable']) allowRegistration?: string;
  @IsOptional() @IsBoolean() maintenanceMode?: boolean;

  // ── general · timezone ──
  @IsOptional() @IsString() @MaxLength(80) timeZone?: string;
  @IsOptional() @IsString() @MaxLength(40) dateFormat?: string;
  @IsOptional() @IsString() @MaxLength(40) timeFormat?: string;

  // ── general · language ──
  @IsOptional() @IsString() @MaxLength(40) defaultLanguage?: string;
  @IsOptional() @IsBoolean() languageSwitcher?: boolean;

  // ── general · country ──
  @IsOptional() @IsString() @MaxLength(120) countryRestriction?: string;
  @IsOptional() @IsString() @MaxLength(400) chooseCountries?: string;

  // ── email ──
  @IsOptional() @IsString() @MaxLength(200) smtpHost?: string;
  @IsOptional() @IsString() @MaxLength(10) smtpPort?: string;
  @IsOptional() @IsString() @MaxLength(20) smtpEncryption?: string;
  @IsOptional() @IsString() @MaxLength(200) smtpUsername?: string;
  @IsOptional() @IsString() @MaxLength(200) smtpPassword?: string;
  @IsOptional() @IsString() @MaxLength(120) emailFromName?: string;
  @IsOptional() @IsString() @MaxLength(200) emailFromAddress?: string;

  // ── security ──
  @IsOptional() @IsString() @MaxLength(40) sessionTimeout?: string;
  @IsOptional() @IsString() @MaxLength(10) loginAttempts?: string;
  @IsOptional() @IsString() @MaxLength(40) passwordLength?: string;
  @IsOptional() @IsBoolean() uppercaseLetterNumber?: boolean;
  @IsOptional() @IsBoolean() specialCharacter?: boolean;
  @IsOptional() @IsBoolean() twoFactorAuth?: boolean;
  @IsOptional() @IsBoolean() ipWhitelist?: boolean;
  @IsOptional() @IsBoolean() auditLogs?: boolean;
  @IsOptional() @IsBoolean() dataEncryption?: boolean;

  // ── notifications ──
  @ApiPropertyOptional({ type: [SettingsNotificationToggleDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SettingsNotificationToggleDto)
  notifications?: SettingsNotificationToggleDto[];
}

/** Fields each section is allowed to carry; anything else is rejected. */
export const SETTINGS_SECTION_FIELDS: Record<SettingsSection, string[]> = {
  siteConfig: [
    'siteName',
    'siteUrl',
    'adminEmail',
    'sitePhone',
    'copyright',
    'siteDescription',
    'allowRegistration',
    'maintenanceMode',
  ],
  timezone: ['timeZone', 'dateFormat', 'timeFormat'],
  language: ['defaultLanguage', 'languageSwitcher'],
  country: ['countryRestriction', 'chooseCountries'],
  smtp: ['smtpHost', 'smtpPort', 'smtpEncryption', 'smtpUsername', 'smtpPassword'],
  mailing: ['emailFromName', 'emailFromAddress'],
  authentication: [
    'sessionTimeout',
    'loginAttempts',
    'passwordLength',
    'uppercaseLetterNumber',
    'specialCharacter',
    'twoFactorAuth',
  ],
  advanced: ['ipWhitelist', 'auditLogs', 'dataEncryption'],
  notifications: ['notifications'],
};

/**
 * The settings rows are keyed by the *sub-section* the UI posts (siteConfig,
 * smtp, authentication…), so the stored key is the payload's `section` when it
 * is one of these, otherwise the route segment.
 */
export const SETTINGS_STORAGE_KEYS = new Set<string>([
  ...SETTINGS_SECTIONS,
  'general',
  'email',
  'security',
]);

export function isKnownSection(value: string): value is SettingsSection {
  return (SETTINGS_SECTIONS as readonly string[]).includes(value);
}
