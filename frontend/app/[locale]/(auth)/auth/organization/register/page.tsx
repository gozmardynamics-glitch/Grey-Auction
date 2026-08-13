'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Landmark,
  Globe,
  HeartHandshake,
  CheckCircle2,
  Briefcase,
  Package,
  Sparkles,
  Mail,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useUser, useOrganizationList, SignUp } from '@clerk/nextjs';

import {
  Button,
  Card,
  Input,
  Label,
  Textarea,
} from '@/shared/components/common';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrgTypeId = 'company' | 'firm' | 'government' | 'embassy' | 'ngo';
type BusinessType = 'AGENCY' | 'GOVERNMENT' | 'EMBASSY' | 'NGO' | 'COMPANY';
type Visibility = 'public' | 'private';

interface OrgTypeOption {
  id: OrgTypeId;
  label: string;
  businessType: BusinessType;
  icon: LucideIcon;
  description: string;
}

interface FormState {
  // Step 1 — Account
  email: string;
  password: string;
  confirmPassword: string;
  // Step 2 — Agency Details
  agencyName: string;
  organizationType: OrgTypeId | null;
  registrationNumber: string;
  contactPerson: string;
  contactPersonTitle: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  secondaryContactName: string;
  secondaryContactTitle: string;
  secondaryContactEmail: string;
  secondaryContactPhone: string;
  addressLine1: string;
  city: string;
  state: string;
  // Step 3 — Auction Intent
  auctionVisibility: Visibility;
  categories: string[];
  consultantListing: boolean;
  consultantNotes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const STEPS = ['Account', 'Agency Details', 'Auction Intent'] as const;

const ORG_TYPES: OrgTypeOption[] = [
  {
    id: 'company',
    label: 'Company',
    businessType: 'COMPANY',
    icon: Building2,
    description: 'Private limited or public company',
  },
  {
    id: 'firm',
    label: 'Firm',
    businessType: 'AGENCY',
    icon: Briefcase,
    description: 'Agency, consultancy or professional firm',
  },
  {
    id: 'government',
    label: 'Government',
    businessType: 'GOVERNMENT',
    icon: Landmark,
    description: 'Ministry, department or parastatal',
  },
  {
    id: 'embassy',
    label: 'Embassy',
    businessType: 'EMBASSY',
    icon: Globe,
    description: 'Diplomatic mission or consulate',
  },
  {
    id: 'ngo',
    label: 'NGO',
    businessType: 'NGO',
    icon: HeartHandshake,
    description: 'Non-governmental organization',
  },
];

const CATEGORIES = [
  'Equipment',
  'Vehicles',
  'Real Estate',
  'Office Assets',
  'Other',
] as const;

const INITIAL_STATE: FormState = {
  email: '',
  password: '',
  confirmPassword: '',
  agencyName: '',
  organizationType: null,
  registrationNumber: '',
  contactPerson: '',
  contactPersonTitle: '',
  contactPersonEmail: '',
  contactPersonPhone: '',
  secondaryContactName: '',
  secondaryContactTitle: '',
  secondaryContactEmail: '',
  secondaryContactPhone: '',
  addressLine1: '',
  city: '',
  state: '',
  auctionVisibility: 'public',
  categories: [],
  consultantListing: false,
  consultantNotes: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Small internal helpers
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

function Field({ label, htmlFor, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface SectionHeadingProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

function SectionHeading({ icon: Icon, title, subtitle }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrganizationRegisterPage() {
  const { isSignedIn, isLoaded: userLoaded, user } = useUser();
  const { createOrganization, isLoaded: orgsLoaded } = useOrganizationList();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [demoNote, setDemoNote] = useState(false);

  // Skip the account step — account creation is handled by Clerk sign-up
  useEffect(() => {
    if (isSignedIn && step === 0) {
      setStep(1);
    }
  }, [isSignedIn, step]);

  // ─── Clerk: render sign-up when no authenticated user ───────────
  if (userLoaded && !isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Register Your Organization</h1>
          <p className="text-sm text-muted-foreground">
            Create the organization account first — agency details come next.
          </p>
        </div>
        <SignUp
          unsafeMetadata={{ role: 'seller' }}
          appearance={{
            elements: {
              rootBox: 'w-full max-w-md',
              card: 'shadow-none border border-border',
            },
          }}
          fallbackRedirectUrl="/auth/organization/register"
        />
      </div>
    );
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleCategory = (category: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const validateStep = (s: number, data: FormState): FormErrors => {
    const e: FormErrors = {};

    if (s === 0) {
      if (!data.email.trim()) e.email = 'Agency email is required';
      else if (!EMAIL_RE.test(data.email)) e.email = 'Enter a valid email address';
      if (!data.password) e.password = 'Password is required';
      else if (data.password.length < 6)
        e.password = 'Password must be at least 6 characters';
      if (!data.confirmPassword) e.confirmPassword = 'Please confirm your password';
      else if (data.confirmPassword !== data.password)
        e.confirmPassword = 'Passwords do not match';
    }

    if (s === 1) {
      if (!data.agencyName.trim()) e.agencyName = 'Agency name is required';
      if (!data.organizationType) e.organizationType = 'Select an organization type';
      if (!data.registrationNumber.trim())
        e.registrationNumber = 'Registration number is required';
      if (!data.contactPerson.trim()) e.contactPerson = 'Contact person is required';
      if (!data.contactPersonEmail.trim())
        e.contactPersonEmail = 'Contact email is required';
      else if (!EMAIL_RE.test(data.contactPersonEmail))
        e.contactPersonEmail = 'Enter a valid email address';
      if (!data.contactPersonPhone.trim())
        e.contactPersonPhone = 'Phone number is required';
      if (!data.addressLine1.trim()) e.addressLine1 = 'Address is required';
      if (!data.city.trim()) e.city = 'City is required';
      if (!data.state.trim()) e.state = 'State is required';
    }

    return e;
  };

  const handleNext = () => {
    const e = validateStep(step, form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setErrors({});
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    const e = validateStep(step, form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);

    const selectedType = ORG_TYPES.find((o) => o.id === form.organizationType);

    const body = {
      business_name: form.agencyName,
      business_type: selectedType?.businessType ?? 'COMPANY',
      business_registration_number: form.registrationNumber,
      email: form.email,
      phone: form.contactPersonPhone,
      contact_person: form.contactPerson,
      contact_person_title: form.contactPersonTitle,
      contact_person_email: form.contactPersonEmail,
      contact_person_phone: form.contactPersonPhone,
      secondary_contact_name: form.secondaryContactName || undefined,
      secondary_contact_title: form.secondaryContactTitle || undefined,
      secondary_contact_email: form.secondaryContactEmail || undefined,
      secondary_contact_phone: form.secondaryContactPhone || undefined,
      address_line1: form.addressLine1,
      city: form.city,
      state: form.state,
      country: 'NG',
      postal_code: '',
      auction_visibility: form.auctionVisibility,
      consultant_listing: form.consultantListing,
      consultant_notes: form.consultantListing ? form.consultantNotes : '',
      categories: form.categories,
    };

    let isDemo = false;
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiBase}/sellers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) isDemo = true;
    } catch {
      isDemo = true;
    }

    // ─── Clerk: create the organization + invite secondary contact ──
    try {
      if (orgsLoaded && createOrganization) {
        const org = await createOrganization({ name: form.agencyName });

        // Invite the secondary contact as an organization member via backend
        if (form.secondaryContactEmail && form.secondaryContactEmail.includes('@')) {
          const apiBase =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          await fetch(`${apiBase}/auth/clerk/invite-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: org.id,
              email: form.secondaryContactEmail,
              role: 'org:admin',
            }),
          }).catch(() => {});
        }
      }
    } catch {}

    setSubmitting(false);
    setDemoNote(isDemo);
    setSubmitted(true);
  };

  // -------------------------------------------------------------------------
  // Success screen
  // -------------------------------------------------------------------------
  if (submitted) {
    return (
      <div className="w-full max-w-lg rounded-2xl bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-foreground">
            Registration Received
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you, <span className="font-semibold text-foreground">{form.agencyName}</span>. We
            have received your organization registration request.
          </p>
          {demoNote && (
            <p className="mt-3 rounded-lg bg-muted px-4 py-2 text-xs text-muted-foreground">
              Registration received — our team will reach out to confirm.
            </p>
          )}
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-sm font-semibold text-foreground">What happens next?</p>
          <ul className="space-y-3">
            {[
              'Our team will contact you to verify your organization.',
              'Once confirmed, you can start listing your assets for auction.',
              'Take advantage of our free consultant listing option if you prefer we handle it.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-sm text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          type="button"
          className="mt-8 w-full h-12"
          onClick={() => window.location.reload()}
        >
          Register another organization
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Wizard
  // -------------------------------------------------------------------------
  return (
    <div className="w-full max-w-2xl">
      {/* Gradient header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-2 to-primary-3 p-8 text-primary-foreground">
        <div className="relative z-10">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Building2 className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold md:text-3xl">
            Organization Registration
          </h1>
          <p className="mt-2 text-sm opacity-90">
            Register your agency, company, firm, government body, embassy or NGO
            as a seller on Grey Auction.
          </p>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 right-16 h-32 w-32 rounded-full bg-white/10" />
      </div>

      <Card className="mt-6 p-6 lg:p-8">
        {/* Progress stepper */}
        <div className="mb-8">
          <div className="flex items-center">
            {STEPS.map((label, i) => {
              const isActive = i === step;
              const isComplete = i < step;
              return (
                <div
                  key={label}
                  className={cn('flex items-center', i > 0 && 'flex-1')}
                >
                  {i > 0 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 rounded-full',
                        isComplete || isActive ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                        isComplete && 'border-primary bg-primary text-primary-foreground',
                        isActive && 'border-primary bg-primary/10 text-primary',
                        !isComplete && !isActive && 'border-border bg-muted text-muted-foreground'
                      )}
                    >
                      {isComplete ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isActive || isComplete
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1 — Account */}
        {step === 0 && (
          <div>
            <SectionHeading
              icon={Mail}
              title="Create your account"
              subtitle="Set up the login credentials for your organization."
            />
            <div className="space-y-5">
              <Field label="Agency email" htmlFor="email" required error={errors.email}>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@yourorganization.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className={cn('h-12', errors.email && 'border-destructive')}
                />
              </Field>
              <Field label="Password" htmlFor="password" required error={errors.password}>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  className={cn('h-12', errors.password && 'border-destructive')}
                />
              </Field>
              <Field
                label="Confirm password"
                htmlFor="confirmPassword"
                required
                error={errors.confirmPassword}
              >
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  className={cn('h-12', errors.confirmPassword && 'border-destructive')}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Step 2 — Agency Details */}
        {step === 1 && (
          <div>
            <SectionHeading
              icon={Building2}
              title="Agency details"
              subtitle="Tell us about your organization and primary contact."
            />

            <div className="space-y-5">
              <Field label="Agency name" htmlFor="agencyName" required error={errors.agencyName}>
                <Input
                  id="agencyName"
                  type="text"
                  placeholder="e.g. Alpha Holdings Ltd"
                  value={form.agencyName}
                  onChange={(e) => update('agencyName', e.target.value)}
                  className={cn('h-12', errors.agencyName && 'border-destructive')}
                />
              </Field>

              {/* Organization type radio cards */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Organization type <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ORG_TYPES.map((option) => {
                    const selected = form.organizationType === option.id;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => update('organizationType', option.id)}
                        className={cn(
                          'flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all',
                          selected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/40 hover:bg-accent'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5',
                            selected ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                        <span className="text-sm font-semibold text-foreground">
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.organizationType && (
                  <p className="text-xs text-destructive">{errors.organizationType}</p>
                )}
              </div>

              <Field
                label="Registration number"
                htmlFor="registrationNumber"
                required
                error={errors.registrationNumber}
              >
                <Input
                  id="registrationNumber"
                  type="text"
                  placeholder="e.g. RC 1234567"
                  value={form.registrationNumber}
                  onChange={(e) => update('registrationNumber', e.target.value)}
                  className={cn('h-12', errors.registrationNumber && 'border-destructive')}
                />
              </Field>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                  label="Contact person name"
                  htmlFor="contactPerson"
                  required
                  error={errors.contactPerson}
                >
                  <Input
                    id="contactPerson"
                    type="text"
                    placeholder="Full name"
                    value={form.contactPerson}
                    onChange={(e) => update('contactPerson', e.target.value)}
                    className={cn('h-12', errors.contactPerson && 'border-destructive')}
                  />
                </Field>
                <Field label="Contact person title" htmlFor="contactPersonTitle">
                  <Input
                    id="contactPersonTitle"
                    type="text"
                    placeholder="e.g. Managing Director"
                    value={form.contactPersonTitle}
                    onChange={(e) => update('contactPersonTitle', e.target.value)}
                    className="h-12"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                  label="Contact email"
                  htmlFor="contactPersonEmail"
                  required
                  error={errors.contactPersonEmail}
                >
                  <Input
                    id="contactPersonEmail"
                    type="email"
                    placeholder="contact@organization.com"
                    value={form.contactPersonEmail}
                    onChange={(e) => update('contactPersonEmail', e.target.value)}
                    className={cn('h-12', errors.contactPersonEmail && 'border-destructive')}
                  />
                </Field>
                <Field
                  label="Phone"
                  htmlFor="contactPersonPhone"
                  required
                  error={errors.contactPersonPhone}
                >
                  <Input
                    id="contactPersonPhone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={form.contactPersonPhone}
                    onChange={(e) => update('contactPersonPhone', e.target.value)}
                    className={cn('h-12', errors.contactPersonPhone && 'border-destructive')}
                  />
                </Field>
              </div>

              {/* ─── Secondary Contact (Recommended) ─────────────────── */}
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 space-y-4">
                <div className="flex items-start gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Secondary Contact Person
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recommended — a second person for account management. At
                      least two authorized persons are advised for organization
                      accounts (e.g. director + finance officer).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    label="Secondary contact name"
                    htmlFor="secondaryContactName"
                  >
                    <Input
                      id="secondaryContactName"
                      type="text"
                      placeholder="Full name"
                      value={form.secondaryContactName}
                      onChange={(e) => update('secondaryContactName', e.target.value)}
                      className="h-12"
                    />
                  </Field>
                  <Field
                    label="Secondary contact title"
                    htmlFor="secondaryContactTitle"
                  >
                    <Input
                      id="secondaryContactTitle"
                      type="text"
                      placeholder="e.g. Finance Manager"
                      value={form.secondaryContactTitle}
                      onChange={(e) => update('secondaryContactTitle', e.target.value)}
                      className="h-12"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    label="Secondary contact email"
                    htmlFor="secondaryContactEmail"
                  >
                    <Input
                      id="secondaryContactEmail"
                      type="email"
                      placeholder="secondary@organization.com"
                      value={form.secondaryContactEmail}
                      onChange={(e) => update('secondaryContactEmail', e.target.value)}
                      className="h-12"
                    />
                  </Field>
                  <Field
                    label="Secondary contact phone"
                    htmlFor="secondaryContactPhone"
                  >
                    <Input
                      id="secondaryContactPhone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={form.secondaryContactPhone}
                      onChange={(e) => update('secondaryContactPhone', e.target.value)}
                      className="h-12"
                    />
                  </Field>
                </div>
              </div>

              <Field
                label="Address line 1"
                htmlFor="addressLine1"
                required
                error={errors.addressLine1}
              >
                <Input
                  id="addressLine1"
                  type="text"
                  placeholder="Street address"
                  value={form.addressLine1}
                  onChange={(e) => update('addressLine1', e.target.value)}
                  className={cn('h-12', errors.addressLine1 && 'border-destructive')}
                />
              </Field>

              <div className="grid grid-cols-2 gap-5">
                <Field label="City" htmlFor="city" required error={errors.city}>
                  <Input
                    id="city"
                    type="text"
                    placeholder="e.g. Lagos"
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    className={cn('h-12', errors.city && 'border-destructive')}
                  />
                </Field>
                <Field label="State" htmlFor="state" required error={errors.state}>
                  <Input
                    id="state"
                    type="text"
                    placeholder="e.g. Lagos State"
                    value={form.state}
                    onChange={(e) => update('state', e.target.value)}
                    className={cn('h-12', errors.state && 'border-destructive')}
                  />
                </Field>
              </div>

              <Field label="Country" htmlFor="country">
                <Input
                  id="country"
                  type="text"
                  value="Nigeria"
                  readOnly
                  disabled
                  className="h-12"
                />
              </Field>
            </div>
          </div>
        )}

        {/* Step 3 — Auction Intent */}
        {step === 2 && (
          <div>
            <SectionHeading
              icon={Sparkles}
              title="Auction intent"
              subtitle="Let us know how you plan to sell."
            />

            <div className="space-y-6">
              {/* Auction visibility */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Auction visibility
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { value: 'public', label: 'Public', description: 'Open to all bidders' },
                      { value: 'private', label: 'Private', description: 'Invited bidders only' },
                    ] as { value: Visibility; label: string; description: string }[]
                  ).map((opt) => {
                    const selected = form.auctionVisibility === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('auctionVisibility', opt.value)}
                        className={cn(
                          'rounded-xl border-2 p-4 text-left transition-all',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40 hover:bg-accent'
                        )}
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {opt.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {opt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categories interested */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Categories interested
                </Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => {
                    const selected = form.categories.includes(category);
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all',
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/40 hover:bg-accent'
                        )}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Consultant option */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Listing support
                </Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => update('consultantListing', false)}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
                      !form.consultantListing
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40 hover:bg-accent'
                    )}
                  >
                    <Package
                      className={cn(
                        'mt-0.5 h-5 w-5',
                        !form.consultantListing ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        List items myself
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Manage your own listings and auctions.
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => update('consultantListing', true)}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
                      form.consultantListing
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40 hover:bg-accent'
                    )}
                  >
                    <HeartHandshake
                      className={cn(
                        'mt-0.5 h-5 w-5',
                        form.consultantListing ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        Let Grey Auction list for me{' '}
                        <span className="text-primary">(FREE)</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Our team handles valuation, photography and listing.
                      </span>
                    </span>
                  </button>
                </div>

                {form.consultantListing && (
                  <Field label="Notes for our team" htmlFor="consultantNotes">
                    <Textarea
                      id="consultantNotes"
                      placeholder="Tell us about the items you'd like us to list..."
                      value={form.consultantNotes}
                      onChange={(e) => update('consultantNotes', e.target.value)}
                    />
                  </Field>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t pt-6">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-primary hover:bg-primary-2"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Registration'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
