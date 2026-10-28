# Administrator two-factor authentication

Status: **implemented and enforced**. Every administrator route in the API refuses a
session that has not proved a second factor, and the actions that move money or change
a person's standing require a *recent* proof on top of that.

## Why it exists

Before this, an administrator's entire authority sat behind one password. That password
could refund escrow to a buyer, release escrow to a seller, credit a wallet, and suspend
an account. A phished or reused credential was therefore a direct route to the platform's
money and to a customer's standing — with nothing in between and nothing in the audit
trail to say it was not the administrator.

## The two levels

The requirement is tiered, because not every administrative act carries the same risk.

| Level | What it is | When it applies | What it protects against |
|---|---|---|---|
| **Assurance level 2 — sign-in** | A TOTP code (or a single-use recovery code) is required before a session token is issued | Every administrator, every sign-in | A stolen or cracked password |
| **Step-up — fresh proof** | A code proved within the last *N* minutes is required to perform the action | Money movement, account suspension, administrator management, the MFA policy itself | A hijacked live session (stolen cookie, unattended machine, XSS) |

The step-up window is per role, and shorter where the role can do more damage:

| Role | Code at sign-in | Step-up window |
|---|---|---|
| `super_admin` | required | 5 minutes |
| `finance_admin` | required | 5 minutes |
| `platform_admin` | required | 10 minutes |
| `support_admin` | required | 15 minutes |

A super admin can change these windows and can switch the requirement off per role — in
production the master switch is refused unless `MFA_ALLOW_DISABLE` is set, because
turning it off silently is exactly the change an attacker with an admin session would
want to make.

### Platform and corporate scopes

The design has two scopes, and only one is assignable today.

**Platform scope** — GreyAuction's own staff. This is the four roles above, and it is
what every route in this system is built for. It is fully implemented.

**Corporate scope** — an *organisation's own* administrators, acting for an institutional
seller on its own lots, payouts and disputes. Its MFA requirements are the same shape
(second factor at sign-in, shorter step-up for anything that touches the organisation's
money) but it is **not assignable yet**, deliberately: an organisation-scoped
administrator has to be bound to one seller organisation so that every query it can run
is filtered to that organisation. There is no such binding in the data model — sellers
are accounts, not teams — so creating the role now would create an administrator that can
see every seller's data while claiming to be scoped to one. That is a data-exposure
hole, not a feature. When organisation seats exist, corporate scope reuses this engine
unchanged: an `orders`/`tickets`/`disputes` filter on the bound seller, a
`@PlatformOnly()` on the money and governance routes, and a policy row for the
corporate roles.

## The flow, in order

```
password ──► /auth/login
              ├─ ordinary account ────────────────────────────► session token
              └─ administrator
                   ├─ enrolled  ── no code ──► 401 MFA_REQUIRED
                   │              + code    ──► verify (TOTP / recovery) ──► session
                   └─ not enrolled ─────────► 401 MFA_ENROLMENT_REQUIRED
                                               │
                                    /auth/mfa/enrol/begin  (email + password)
                                               │  secret + otpauth URI + 10 recovery codes
                                               ▼
                                    /auth/login  (+ code from the new secret)
                                               │  arms the factor, issues the session
                                               ▼
                                            session
```

Three properties are deliberate:

1. **There is no half-authenticated credential.** The password check returns a reason,
   not a token; the code is sent in the same call that issues the session. Nothing that
   could be stolen exists between the two steps.
2. **The login route cannot be bypassed by a flag.** The decision is made from the
   `admins` row and the policy in the database, not from anything the client sends.
3. **Enrolment happens before the session**, because an administrator who has not enrolled
   cannot sign in. Recovery codes are therefore issued at setup, before there is a session
   in which to display them.

### Step-up, on the wire

A guarded route answers `403 { code: 'STEP_UP_REQUIRED', windowMinutes: N }` when the
proof is stale. The admin console catches that code in one place (`apiFetch` →
`StepUpHost`) and opens a prompt; after the code is accepted, the administrator repeats
the action. Nothing is replayed automatically on their behalf.

Guarded routes:

- `POST /escrow/holds/:id/release`, `/refund`, `/partial-refund`
- `POST /admin/wallets/:userId/credit`
- `POST /admin/buyers/:id/suspend`
- `POST|PATCH|DELETE /admin/admins/:id`
- `POST /admin/mfa/:adminId/reset`
- `PUT /admin/mfa/policy`
- `PUT /settings/:section`

## Storage

| Column (`admins`) | Purpose |
|---|---|
| `mfaEnabled`, `mfaEnrolledAt` | Whether a factor is armed |
| `mfaSecret` | The TOTP shared secret, **AES-256-GCM encrypted** (`v1.iv.tag.ciphertext`) |
| `mfaRecoveryCodes` | SHA-256 hashes of single-use codes, plus when each was used |
| `mfaLastStep` | Highest TOTP counter accepted — one code can never be used twice |
| `mfaFailedAttempts`, `mfaLockedUntil` | 5 wrong codes locks the account for 15 minutes |
| `lastMfaAt` | When a factor was last proved; drives the step-up window |

The encryption key is `ADMIN_MFA_KEY` (32 bytes, hex or base64) when set, otherwise
derived from `JWT_SECRET`. **Set `ADMIN_MFA_KEY` in production**: rotating `JWT_SECRET`
should not silently invalidate every administrator's authenticator.

## Recovery

Four ways back in, in the order they should be tried:

1. **Wait for the next code.** A code is refused if it is the one just used; 30 seconds later there is another.
2. **Use a recovery code.** Ten are issued at setup, each works once, and they are accepted at sign-in.
3. **A super admin resets the factor.** `POST /admin/mfa/:adminId/reset` (step-up required,
   audited, and refused against your own account). The administrator then enrols again at
   their next sign-in.
4. **A database edit** — last resort, unaudited, and not a supported path.

## Local development

```
node tools/admin/enrol-mfa.js      # resets nothing; enrols and prints the otpauth URI
```

It writes the shared secret to `.admin-mfa-secret` (git-ignored) so `tools/legal`,
`tools/faq`, `tools/audit` and `testdata/seed.js` can sign in without a phone. To start
over, clear the enrolment columns on the admin row and run it again.

## What is not built

- **Self-service device rotation.** An administrator cannot add a second device from a
  live session; the recovery codes and the super-admin reset cover the same need.
- **SMS or email as a second factor.** TOTP only. A code delivered to the same inbox as
  the password reset link is not a second factor.
- **Passkeys/WebAuthn**, and **step-up prompts with a replayed action** (the user repeats
  the action instead).

## Verification

- `backend/src/admin-mfa/totp.spec.ts` — pinned to the RFC 6238 and RFC 4226 vectors.
- `backend/src/admin-mfa/admin-mfa.service.spec.ts` — policy merge, gate, enrolment,
  replay, lockout, recovery codes, step-up windows, reset.
- `backend/src/admin/guards/admin-roles.guard.spec.ts` — the enrolment gate.
- Live: 41 API assertions and 19 browser assertions covering first sign-in, enrolment,
  the panel, the step-up prompt and the retried action.
