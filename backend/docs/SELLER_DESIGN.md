# Seller Entity Design

## Entity Structure

### Seller Table (Main Profile)

```typescript
{
  id: uuid (PK)
  user_id: uuid (FK to users) - For authentication
  
  // Business Information
  business_name: string
  business_type: enum (INDIVIDUAL, SOLE_PROPRIETORSHIP, LLC, CORPORATION)
  business_registration_number: string
  tax_id: string
  
  // Contact
  email: string
  phone: string
  website: string (nullable)
  
  // Address
  address_line1: string
  address_line2: string (nullable)
  city: string
  state: string
  postal_code: string
  country: string
  
  // Verification Status
  verification_status: enum (PENDING, APPROVED, REJECTED, SUSPENDED)
  verification_notes: text (nullable)
  verified_at: timestamp (nullable)
  verified_by_id: uuid (nullable) - Admin who verified
  
  // Financial
  commission_rate: decimal (platform fee %)
  payout_method: enum (BANK_TRANSFER, MOBILE_MONEY, CRYPTO)
  bank_account_details: jsonb (encrypted)
  
  // Performance Metrics
  total_sales: decimal
  total_products: int
  active_products: int
  rating: decimal (1-5)
  total_reviews: int
  
  // Status
  status: enum (ACTIVE, INACTIVE, SUSPENDED, BANNED)
  suspension_reason: text (nullable)
  
  // Metadata
  metadata: jsonb
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (soft delete)
}
```

---

## Related Entities

### SellerDocument (KYC Documents)

```typescript
{
  id: uuid (PK)
  seller_id: uuid (FK)
  
  document_type: enum (
    BUSINESS_LICENSE,
    TAX_CERTIFICATE,
    ID_CARD,
    PROOF_OF_ADDRESS,
    BANK_STATEMENT,
    OTHER
  )
  
  file_url: string
  file_name: string
  file_size: int
  mime_type: string
  
  verification_status: enum (PENDING, APPROVED, REJECTED)
  verification_notes: text
  verified_at: timestamp
  verified_by_id: uuid (Admin)
  
  uploaded_at: timestamp
  expires_at: timestamp (nullable)
}
```

### SellerPayout (Payment History)

```typescript
{
  id: uuid (PK)
  seller_id: uuid (FK)
  
  amount: decimal
  currency: string
  status: enum (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
  
  payout_method: string
  payout_details: jsonb
  reference_number: string
  
  requested_at: timestamp
  processed_at: timestamp
  completed_at: timestamp
  
  notes: text
  metadata: jsonb
}
```

### SellerReview (Customer Reviews)

```typescript
{
  id: uuid (PK)
  seller_id: uuid (FK)
  bidder_id: uuid (FK) - Who left the review
  auction_id: uuid (FK) - Related auction
  
  rating: int (1-5)
  comment: text
  
  response: text (nullable) - Seller's response
  responded_at: timestamp (nullable)
  
  status: enum (ACTIVE, HIDDEN, FLAGGED)
  created_at: timestamp
  updated_at: timestamp
}
```

### SellerStatistics (Daily/Weekly/Monthly Stats)

```typescript
{
  id: uuid (PK)
  seller_id: uuid (FK)
  
  period_type: enum (DAILY, WEEKLY, MONTHLY)
  period_start: date
  period_end: date
  
  total_sales: decimal
  total_orders: int
  total_products_listed: int
  average_rating: decimal
  
  created_at: timestamp
}
```

---

## Enums

```typescript
enum SellerBusinessType {
  INDIVIDUAL = 'INDIVIDUAL',
  SOLE_PROPRIETORSHIP = 'SOLE_PROPRIETORSHIP',
  LLC = 'LLC',
  CORPORATION = 'CORPORATION',
  PARTNERSHIP = 'PARTNERSHIP',
}

enum SellerVerificationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

enum SellerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

enum SellerPayoutMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CRYPTO = 'CRYPTO',
  CHECK = 'CHECK',
}

enum DocumentType {
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  TAX_CERTIFICATE = 'TAX_CERTIFICATE',
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  BANK_STATEMENT = 'BANK_STATEMENT',
  OTHER = 'OTHER',
}

enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}
```

---

## Relationships

```
User (1) ─── (1) Seller
  └─ One user account per seller (authentication)

Seller (1) ─── (N) SellerDocument
  └─ Multiple KYC documents per seller

Seller (1) ─── (N) Product
  └─ Seller owns multiple products

Seller (1) ─── (N) SellerPayout
  └─ Payment history

Seller (1) ─── (N) SellerReview
  └─ Customer reviews

Seller (1) ─── (N) SellerStatistics
  └─ Performance metrics over time

Admin (1) ─── (N) Seller (verified_by)
  └─ Admin who verified the seller

Admin (1) ─── (N) SellerDocument (verified_by)
  └─ Admin who verified documents
```

---

## Workflow

### Seller Registration Flow

1. **Sign Up** (User table)
   - Create user account with role: SELLER
   - Email verification

2. **Complete Profile** (Seller table)
   - Business information
   - Contact details
   - Address

3. **Upload Documents** (SellerDocument table)
   - Business license
   - Tax certificate
   - ID verification
   - Bank details

4. **Admin Review**
   - Admin reviews application
   - Verifies documents
   - Approves or rejects

5. **Activation**
   - Seller can start listing products
   - Access seller dashboard

### Product Listing Flow

1. Seller creates product
2. Product goes to PENDING status
3. Admin reviews (optional)
4. Product becomes ACTIVE
5. Can be listed in auctions

### Payout Flow

1. Seller requests payout
2. Admin reviews request
3. Payment processed
4. Payout completed/failed
5. Seller notified

---

## Security Considerations

1. **Sensitive Data Encryption**
   - Bank account details (JSONB encrypted)
   - Tax ID
   - Business registration number

2. **Document Storage**
   - Secure file upload (S3/GCS)
   - Access control (signed URLs)
   - Automatic expiry

3. **Rate Limiting**
   - Payout requests (max 1 per day)
   - Document uploads (max 10 per session)

4. **Audit Trail**
   - All status changes logged
   - Document verification history
   - Payout history

---

## API Endpoints Plan

### Seller (Public)
- POST `/auth/seller/register` - Register seller
- POST `/auth/seller/login` - Login
- GET `/sellers/:id/public-profile` - View public profile
- GET `/sellers/:id/products` - View seller's products
- GET `/sellers/:id/reviews` - View reviews

### Seller (Authenticated)
- GET `/seller/profile` - My profile
- PUT `/seller/profile` - Update profile
- POST `/seller/documents` - Upload document
- GET `/seller/documents` - List my documents
- GET `/seller/dashboard` - Dashboard stats
- GET `/seller/sales` - Sales history
- POST `/seller/payout-request` - Request payout
- GET `/seller/payouts` - Payout history
- GET `/seller/reviews` - My reviews
- POST `/seller/reviews/:id/respond` - Respond to review

### Admin
- GET `/admin/sellers` - List all sellers
- GET `/admin/sellers/:id` - View seller details
- PUT `/admin/sellers/:id/verify` - Verify seller
- PUT `/admin/sellers/:id/reject` - Reject seller
- PUT `/admin/sellers/:id/suspend` - Suspend seller
- GET `/admin/sellers/:id/documents` - View documents
- PUT `/admin/sellers/:id/documents/:docId/verify` - Verify document
- GET `/admin/seller-payouts` - All payout requests
- PUT `/admin/seller-payouts/:id/process` - Process payout

---

## Performance Metrics

Sellers can track:
- Total sales (all time)
- Sales this month
- Average rating
- Total reviews
- Active products
- Pending orders
- Conversion rate
- Top-selling products

---

**Ready to start building?** 

Shall we begin with **Step 2: Creating the Seller Entity**?
