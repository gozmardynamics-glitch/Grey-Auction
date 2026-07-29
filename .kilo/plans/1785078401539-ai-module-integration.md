# AI Module Integration Plan

**Goal:** Build the complete model-agnostic AI layer — backend entities, API, provider implementations, orchestration, and admin UI — then integrate AI features into seller, buyer, and public sections.

**Reference:** `pendingwork.md` §4 (AI Architecture).

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Super Admin AI Panel                       │
│  /admin/ai → Dashboard │ Providers │ Features │ Usage Logs    │
├──────────────────────────────────────────────────────────────┤
│                    Backend API Layer                          │
│  GET/POST/PATCH/DELETE /admin/ai/providers                   │
│  GET/POST/PATCH/DELETE /admin/ai/providers/:id/models         │
│  GET/PATCH            /admin/ai/features                      │
│  GET                  /admin/ai/usage                         │
├──────────────────────────────────────────────────────────────┤
│                  AI Orchestrator Service                      │
│  execute(featureKey, input) → primary → fallback → tertiary   │
├──────────────────────────────────────────────────────────────┤
│                 Provider Implementations                      │
│  OpenAICompatible (base) → OpenAI, DeepSeek, Qwen, Zhipu,    │
│  Moonshot, MiniMax, StepFun, Nvidia, OpenRouter, Custom      │
│  ClaudeProvider, GeminiProvider                                │
├──────────────────────────────────────────────────────────────┤
│  ai_feature_configs  │  ai_usage_logs                        │
│  llm_providers       │  llm_models                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Task List

### Step 1: Database Entities + Migration

**Create 4 entities in `backend/src/ai/entities/`:**

| File | Table | Key Columns |
|------|-------|-------------|
| `llm-provider.entity.ts` | `llm_providers` | name (unique), displayName, baseUrl, apiKey (encrypted), headers (jsonb), isActive, tier |
| `llm-model.entity.ts` | `llm_models` | providerId (FK), modelId, displayName, capabilities (simple-array), contextWindow, maxOutputTokens, pricing, defaultTemperature |
| `ai-feature-config.entity.ts` | `ai_feature_configs` | featureKey (unique), section, primaryModelId (FK), fallbackModelId (FK), tertiaryModelId (FK), isEnabled, systemPrompt, temperature, maxTokens, rateLimits |
| `ai-usage-log.entity.ts` | `ai_usage_logs` | featureKey, modelId, providerName, userId, promptTokens, completionTokens, estimatedCost, latencyMs, success |

**Naming convention:** Follow existing entity patterns — `@Entity('table_name')`, `@PrimaryGeneratedColumn('uuid')`, `@CreateDateColumn()`, `@UpdateDateColumn()`.

**Relationships:**
- `LLMModel` → ManyToOne → `LLMProvider`
- `AIFeatureConfig` → ManyToOne → `LLMModel` (three times: primary, fallback, tertiary)

**Add to `app.module.ts`:** Import `AIModule` (which imports `TypeOrmModule.forFeature([...all 4 entities])`).

**Migration:** TypeORM `synchronize: true` auto-creates tables — no manual migration needed for now.

---

### Step 2: AI Module Backend

**Directory:** `backend/src/ai/`
```
ai/
├── ai.module.ts
├── entities/
│   ├── llm-provider.entity.ts
│   ├── llm-model.entity.ts
│   ├── ai-feature-config.entity.ts
│   └── ai-usage-log.entity.ts
├── dto/
│   ├── create-provider.dto.ts
│   ├── update-provider.dto.ts
│   ├── create-model.dto.ts
│   ├── create-feature-config.dto.ts
│   └── update-feature-config.dto.ts
├── ai.controller.ts          — Admin CRUD endpoints
└── ai.service.ts             — Registry management (CRUD for providers/models/configs)
```

**API Endpoints (all super-admin guarded with `@AdminRoles(SUPER_ADMIN)`):**

```
GET    /admin/ai/providers              — List all providers with model counts
POST   /admin/ai/providers              — Create new provider
GET    /admin/ai/providers/:id           — Get provider details + models
PATCH  /admin/ai/providers/:id           — Update provider (name, apiKey, baseUrl, headers)
DELETE /admin/ai/providers/:id           — Remove provider + cascade models

GET    /admin/ai/providers/:id/models    — List models for a provider
POST   /admin/ai/providers/:id/models    — Add model to provider
PATCH  /admin/ai/providers/:id/models/:mid — Update model (pricing, capabilities, active)
DELETE /admin/ai/providers/:id/models/:mid — Remove model

POST   /admin/ai/providers/:id/health    — Test connection (GET /v1/models, check status)

GET    /admin/ai/features                — List all 17 feature configs
GET    /admin/ai/features/:id            — Get single feature config
PATCH  /admin/ai/features/:id            — Update (assign models, toggle, temperature, prompts)

GET    /admin/ai/usage                   — Usage logs (query params: dateFrom, dateTo, feature)
GET    /admin/ai/usage/summary           — Aggregated stats (total tokens, cost, by provider)
```

**DTOs:** Use `class-validator` decorators (`@IsString`, `@IsOptional`, `@IsBoolean`, `@IsNumber`, `@IsArray`, `@IsUUID`) following existing patterns in the codebase.

**Service methods:** `ai.service.ts` handles CRUD for all 4 entities. Encrypt API keys with `crypto.createCipheriv` before storing (reuse pattern from existing services or use bcrypt for one-way).

---

### Step 3: Provider Implementations

**Directory:** `backend/src/common/ai/`
```
common/ai/
├── ai.module.ts
├── interfaces/
│   └── ai-provider.interface.ts
├── providers/
│   ├── openai-compatible.base.ts     — Base class using fetch()
│   ├── openai.provider.ts            — extends base, adds vision + embeddings
│   ├── deepseek.provider.ts          — extends base
│   ├── qwen.provider.ts             — extends base
│   ├── zhipu.provider.ts            — extends base
│   ├── moonshot.provider.ts         — extends base
│   ├── minimax.provider.ts          — extends base
│   ├── stepfun.provider.ts          — extends base
│   ├── nvidia.provider.ts           — extends base
│   ├── openrouter.provider.ts       — extends base
│   ├── custom.provider.ts           — extends base (baseUrl from DB)
│   ├── claude.provider.ts           — standalone (Anthropic API)
│   └── gemini.provider.ts           — standalone (Google AI API)
├── services/
│   ├── ai-orchestrator.service.ts   — Primary entry point
│   └── ai-usage-log.service.ts      — Logging helper
└── decorators/
    └── ai-feature.decorator.ts       — @AIFeature('key') metadata
```

**Interface** (from `pendingwork.md` §4.2.1): `AIProvider` with `chat()`, `chatJSON()`, `chatStream()`, `listModels()`, `healthCheck()`. Optional: `analyzeImage()`, `generateImage()`, `embed()`, `embedBatch()`.

**OpenAICompatible base class:** Uses raw `fetch()` to call `/v1/chat/completions`. Handles both JSON and streaming responses. Reads API key + base URL from its config (passed at construction, NOT hardcoded). All Chinese providers extend this — zero code duplication.

**Claude + Gemini:** Use `fetch()` with their own REST APIs. No SDK dependency needed.

**`CommonAIModule`** exports `AIOrchestratorService` and is imported by `CommonModule`.

**No SDK dependencies:** We use raw `fetch()` for ALL providers. No `openai` npm package, no `@anthropic-ai/sdk`, no `@langchain/core`. This keeps the bundle small and avoids vendor lock-in.

---

### Step 4: AI Orchestrator Service

**File:** `backend/src/common/ai/services/ai-orchestrator.service.ts`

```typescript
@Injectable()
export class AIOrchestratorService {
  async execute(featureKey: string, input: AIFeatureInput, userId?: string): Promise<AIFeatureOutput> {
    // 1. Load feature config from DB
    // 2. Check rate limits
    // 3. Try primary model → fallback → tertiary
    // 4. Log usage (success or failure)
    // 5. Return result
  }
}
```

**Rate limiting:** Use a simple in-memory token bucket (Map<featureKey, { tokens, lastRefill }>). No external dependency.

**Fallback logic:** On any error (timeout, rate limit, model unavailable), immediately try the next model without retrying the current one. Log each attempt.

---

### Step 5: Register in AppModule

**`backend/src/ai/ai.module.ts`:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([LLMProvider, LLMModel, AIFeatureConfig, AIUsageLog])],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService, TypeOrmModule],
})
export class AIModule {}
```

**`backend/src/common/ai/ai.module.ts`:**
```typescript
@Module({
  imports: [AIModule],
  providers: [AIOrchestratorService, AIUsageLogService, ...allProviders],
  exports: [AIOrchestratorService],
})
export class CommonAIModule {}
```

**`app.module.ts`:** Add `AIModule` to imports. **`common.module.ts`:** Import and re-export `CommonAIModule`.

---

### Step 6: Frontend Admin AI Pages

**Directory:** `frontend/app/[locale]/(domain)/admin/ai/`
```
admin/ai/
├── page.tsx                  — AI Dashboard (widget cards, health status)
├── providers/
│   ├── page.tsx              — Provider list with status indicators
│   └── [providerId]/
│       ├── page.tsx          — Edit provider (form: name, URL, key, headers, tier)
│       └── models/
│           ├── page.tsx      — Model list for this provider
│           └── [modelId]/
│               └── page.tsx  — Edit model (pricing, capabilities, active)
├── features/
│   ├── page.tsx              — Feature config list (17 features, current model, toggle)
│   └── [featureKey]/
│       └── page.tsx          — Edit feature (model dropdown, temperature, prompts)
└── usage/
    ├── page.tsx              — Usage dashboard (charts)
    └── logs/
        └── page.tsx          — Raw usage logs with filters
```

**Pattern:** Follow existing admin island pattern. Each `page.tsx` is thin:
```tsx
import AIDashboard from '../_islands/ai_dashboard';
export default function AIPage() { return <AIDashboard />; }
```

**Components to create** (in `admin/_islands/` or `admin/ai/_islands/`):
- `ai_dashboard.tsx` — 4 stat cards (providers, models, features, 30d cost) + provider health grid + usage chart
- `ai_providers_list.tsx` — Table with columns: Name, API Type, Models, Status, Actions
- `ai_provider_form.tsx` — Form: name, base URL, API key input (password field), headers (JSON editor), tier select
- `ai_model_list.tsx` — Table per provider: Model ID, Display Name, Capabilities, Pricing, Active toggle
- `ai_model_form.tsx` — Form: model ID, display name, capabilities checkboxes, pricing fields, features toggles
- `ai_features_list.tsx` — Table: Feature, Section, Primary Model, Fallback, Enabled toggle, Quality badge
- `ai_feature_config.tsx` — Form: model dropdowns (primary/fallback/tertiary), temperature slider, max tokens input, system prompt textarea, rate limits, quality selector
- `ai_usage_logs.tsx` — Table with date range filter, export
- `ai_usage_dashboard.tsx` — Bar chart (tokens by day), pie chart (cost by provider), line chart (requests by feature)

**Reuse existing shadcn components:** `<Card>`, `<Button>`, `<Input>`, `<Select>`, `<Switch>`, `<Badge>`, `<Table>`, `<Tabs>`, `<Slider>`, `<Dialog>`, `<Spinner>`, `<EmptyState>`, `<DataTable>` — all already exist in `@/shared/components/common/`.

**Charts:** Use the existing `<Chart>` component from `@/shared/components/common/chart.tsx`.

**Toast:** Use `toast.success()` / `toast.error()` from `'sonner'` (already available).

---

### Step 7: Register AI in Admin Sidebar

**File:** `frontend/components/layouts/admin/admin_sidebar.tsx` (or wherever the admin navigation links are defined)

Add a new navigation item:
```tsx
{
  label: 'AI',
  href: '/admin/ai',
  icon: <BrainIcon />,  // or SparklesIcon from lucide-react
  roles: ['super_admin', 'platform_admin'],
  children: [
    { label: 'Dashboard', href: '/admin/ai' },
    { label: 'Providers', href: '/admin/ai/providers' },
    { label: 'Features', href: '/admin/ai/features' },
    { label: 'Usage', href: '/admin/ai/usage' },
  ],
}
```

**Seed data:** Create a seeder that populates the `ai_feature_configs` table with the 17 default features from `pendingwork.md` §4.3, all initially disabled. The super admin enables them after configuring at least one provider and model.

---

### Step 8: Feature Integrations

Once the infrastructure is built, wire AI into the actual application flows:

**Seller — Auction Description Generator**
- Target: Seller listing creation form (find the actual page path)
- Add a "Generate with AI" button next to the description textarea
- Click → calls `AIOrchestratorService.execute('auction_description_generator', { specs, title, category })`
- Shows streaming output in the textarea with a loading spinner
- Uses `useAIFeature` hook (see below)

**Seller — Image Auto-Tagging**
- Target: Image upload step in listing creation
- After image upload, call `image_auto_tagging` feature
- Display suggested tags as badges, click to add/remove
- Also trigger `image_captioning` for accessibility alt text

**Public — AI Chatbot Widget**
- Target: All public pages (floating button, bottom-right)
- Create `frontend/shared/components/ai/chatbot.tsx`
- Floating chat interface with: message list, input, send button
- System prompt set from `ai_feature_configs` for `chatbot_assistant`
- Streams responses with typing indicator
- Persists chat history to localStorage

**Shared React Hook — `useAIFeature`**
```typescript
// frontend/shared/hooks/use-ai-feature.ts
export function useAIFeature(featureKey: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (input: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/ai/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureKey, input }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data.output);
      return data.output;
    } catch (e) {
      setError(e.message);
      toast.error('AI feature failed. A fallback model may be used.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [featureKey]);

  return { execute, result, isLoading, error };
}
```

**Backend — AI Execute Endpoint**
- `POST /ai/execute` — public endpoint (no admin guard needed)
- Body: `{ featureKey: string, input: Record<string, any> }`
- Calls `AIOrchestratorService.execute(featureKey, input, req.user?.id)`
- Returns `{ output: string, modelUsed: string, latencyMs: number }`

---

### Step 9: Verification

**Backend verification:**
1. Run `npm run build` in backend — TypeScript compiles without errors
2. Run `npm test` in backend — all existing 40 tests still pass
3. Test manually via Swagger at `/api/docs`:
   - `POST /admin/ai/providers` → creates a provider
   - `POST /admin/ai/providers/:id/models` → adds a model
   - `PATCH /admin/ai/features/:id` → assigns model to feature
   - `POST /admin/ai/providers/:id/health` → tests connection
   - `POST /ai/execute` → runs an AI feature

**Frontend verification:**
1. Run `npx tsc --noEmit --pretty` in frontend — zero TypeScript errors
2. Run `npm test` in frontend — all existing 32 tests still pass
3. Navigate to `/en/admin/ai` — dashboard renders with placeholder data
4. Navigate to `/en/admin/ai/providers` — CRUD table renders
5. Navigate to `/en/admin/ai/features` — 17 feature configs listed

**Integration verification:**
1. Visit a public page — chatbot floating button visible
2. Visit seller listing form — "Generate with AI" button visible
3. All new pages follow existing responsive design patterns

---

## Implementation Order

| Step | Description | Dependencies |
|------|-------------|-------------|
| 1 | Backend entities + migration | None |
| 2 | AI module backend (controller, service, DTOs) | Step 1 |
| 3 | Provider implementations (base + 12 providers) | Step 1 |
| 4 | AI Orchestrator service | Steps 2, 3 |
| 5 | Register in AppModule / CommonModule | Steps 2, 4 |
| 6 | Frontend admin AI pages (all 10 pages) | Step 2 |
| 7 | Register AI in admin sidebar | Step 6 |
| 8 | Feature integrations (seller, chatbot, hook) | Steps 4, 6 |
| 9 | Verification | All steps |

**Parallelizable:** Steps 6–7 (frontend) can run in parallel with Steps 3–5 (backend providers) once Step 2 is done.
