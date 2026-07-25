# OneTopay — Seller Account System

Complete, production-ready NestJS module for seller (marketplace vendor) management,
built for the OneTopay auction platform. Generated across Steps 1–6 of the session.

## What's Inside

```
seller-system-package/
├── docs/
│   ├── SELLER_DESIGN.md          Full architecture & workflow design doc
│   └── SERVICES_SUMMARY.md       Service responsibilities reference
│
└── src/
    ├── seller/
    │   ├── entities/              5 TypeORM entities
    │   │   ├── seller.entity.ts
    │   │   ├── seller-document.entity.ts
    │   │   ├── seller-payout.entity.ts
    │   │   ├── seller-review.entity.ts
    │   │   ├── seller-statistics.entity.ts
    │   │   └── index.ts
    │   │
    │   ├── dto/                   7 DTO files (validation via class-validator)
    │   │   ├── register-seller.dto.ts
    │   │   ├── update-seller.dto.ts
    │   │   ├── seller-verification.dto.ts   (Approve/Reject/Suspend/Commission)
    │   │   ├── seller-document.dto.ts       (Upload/Verify/Update)
    │   │   ├── seller-payout.dto.ts         (Request/Process/Cancel/Query)
    │   │   ├── seller-review.dto.ts         (Create/Respond/Flag/Query)
    │   │   ├── seller-query.dto.ts          (List filtering)
    │   │   └── index.ts
    │   │
    │   ├── guards/                 3 guards
    │   │   ├── seller.guard.ts               Loads seller, checks suspended/banned
    │   │   ├── verified-seller.guard.ts      Requires APPROVED verification status
    │   │   ├── seller-ownership.guard.ts     Ensures seller only touches own resources
    │   │   └── index.ts
    │   │
    │   ├── decorators/             3 decorators
    │   │   ├── current-seller.decorator.ts   @CurrentSeller()
    │   │   ├── seller-only.decorator.ts      @SellerOnly()
    │   │   ├── require-verification.decorator.ts  @RequireVerification()
    │   │   └── index.ts
    │   │
    │   ├── services/                5 services (business logic)
    │   │   ├── seller.service.ts             CRUD + verification + stats
    │   │   ├── seller-document.service.ts    KYC upload/verify/expiry
    │   │   ├── seller-payout.service.ts      Payout request/process/cancel/retry
    │   │   ├── seller-review.service.ts      Reviews, ratings, moderation
    │   │   ├── seller-statistics.service.ts  Performance metrics & leaderboards
    │   │   └── index.ts
    │   │
    │   ├── seller.controller.ts     40+ REST endpoints
    │   └── seller.module.ts         Wires everything together
    │
    └── database/
        ├── migrations/
        │   └── 1234567890124-CreateSellerTables.ts   9 enums + 5 tables + indexes
        └── seeds/
            └── seed-sellers.ts       3 sample seller accounts
```

## Integration Steps

1. **Copy the `src/seller` folder** into your project's `src/` directory.
2. **Copy the migration** into `src/database/migrations/` and rename the
   timestamp prefix to the current time (e.g. `$(date +%s)000-CreateSellerTables.ts`)
   so it runs in the correct order relative to other migrations.
3. **Copy the seed script** into `src/database/seeds/` and replace the
   placeholder `user-id-1/2/3` values with real user IDs from your `users` table.
4. **Register the module** in `src/app.module.ts`:
   ```typescript
   import { SellerModule } from './seller/seller.module';

   @Module({
     imports: [
       // ...existing imports
       SellerModule,
     ],
   })
   export class AppModule {}
   ```
5. **Run the migration:**
   ```bash
   npm run migration:run:dev
   ```
6. **(Optional) Run the seed script** after updating user IDs:
   ```bash
   npm run seed:sellers:dev
   ```
7. **Ensure dependencies are installed** (if not already in the project):
   ```bash
   npm install @nestjs/platform-express multer
   npm install -D @types/multer
   ```
   (Needed for the `FileInterceptor` used in the document upload endpoint.)
8. **Wire up file storage** — the `uploadDocument` endpoint in
   `seller.controller.ts` currently has a placeholder for S3/GCS upload.
   Replace the `fileData.url` generation with your actual storage integration.
9. **Confirm `CurrentUser` decorator** — the controller references a
   `CurrentUser` decorator (defined at the bottom of `seller.controller.ts`)
   to extract the JWT user for registration/reviews. If your project already
   has one in `src/auth/`, import that instead and remove the duplicate.

## Notes

- All admin-only endpoints depend on the **Admin system** (`AdminRolesGuard`,
  `@AdminRoles()`, `@CurrentAdmin()`) built in a previous session — make sure
  that module is already integrated.
- All seller-only endpoints depend on regular user JWT auth (`JwtAuthGuard`)
  being available at `src/auth/guards/jwt-auth.guard.ts`.
- See `docs/SELLER_DESIGN.md` for the full entity relationship diagram,
  workflows (registration → verification → activation, product listing,
  payout flow), and the original endpoint plan.
- See `docs/SERVICES_SUMMARY.md` for a quick reference of what each service
  method does.

## Endpoint Categories (40+ total)

- Registration & Profile (4)
- Dashboard (1)
- Admin: Seller Management (7)
- Documents / KYC (7)
- Payouts (6)
- Reviews (6)
- Statistics (4)
- Platform Statistics (1)

Full endpoint list is documented via Swagger decorators directly in
`seller.controller.ts` — run the app and visit `/api/docs`.
