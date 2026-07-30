# Agent MCP — Multi-Agent Orchestration with MCP Protocol

> **Portable guide for integrating AI agent orchestration into any application.**  
> Used in production at GreyAuction. Adaptable to any NestJS/Node.js backend.

---

## Table of Contents

1. [Concept & Philosophy](#1-concept--philosophy)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Schema](#3-database-schema)
4. [MCP Protocol Integration](#4-mcp-protocol-integration)
5. [Agent Lifecycle](#5-agent-lifecycle)
6. [Workflow Engine](#6-workflow-engine)
7. [Gap Analyzer & Self-Improvement](#7-gap-analyzer--self-improvement)
8. [API Reference](#8-api-reference)
9. [Implementation Guide](#9-implementation-guide)
10. [Connecting Hermes Agent](#10-connecting-hermes-agent)
11. [Extending for Other Applications](#11-extending-for-other-applications)

---

## 1. Concept & Philosophy

### The Problem

Most AI integrations are rigid — a single chatbot here, a hardcoded description generator there. When you want to add a new AI capability (fraud detection, email campaigns, CRM), you write new code, deploy, and cross your fingers.

### The Solution

**Agent MCP** treats AI capabilities as a **registry of agents, tools, and workflows** that the super admin manages through a UI — no code deploys needed. It's built on three principles:

1. **Loose coupling** — Enable/disable agents with a toggle. No service restarts.
2. **MCP protocol** — Any MCP-compatible client (Hermes, Claude Desktop, Cursor) can call your tools.
3. **Self-improvement** — A gap analyzer scans your system and suggests new agents, tools, and workflows.

### Key Terms

| Term | Definition |
|------|-----------|
| **Agent Instance** | An AI persona with a system prompt, model, tool bindings, and trigger events |
| **Tool** | A callable API endpoint registered with input/output schemas |
| **Workflow** | A multi-step chain linking agents and tools with failure handling |
| **MCP (Model Context Protocol)** | Open standard for AI-tool communication (JSON-RPC 2.0) |
| **Gap Analyzer** | Auto-discovery engine that scans for missing coverage and optimization opportunities |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Super Admin UI (Agent Studio)                 │
│                                                                   │
│  /admin/agents → Dashboard │ Instances │ Tools │ Workflows        │
│  /admin/agents/monitoring — metrics & logs                       │
│                                                                   │
│  [Update Button] → triggers GapAnalyzer → shows gaps + fixes      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ AgentOrchestrator│  │ AgentGapAnalyzer │  │ MCPServerService │  │
│  │                  │  │                  │  │                  │  │
│  │ • executeAgent() │  │ • runAnalysis()  │  │ • listTools()    │  │
│  │ • triggerEvent() │  │ • 6 categories   │  │ • callTool()     │  │
│  │ • discover()     │  │ • templates      │  │ • MCP JSON-RPC   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │            │
│  ┌────────┴─────────────────────┴─────────────────────┴─────────┐ │
│  │                     AgentsService (CRUD)                      │ │
│  │  agent_instances │ agent_tools │ agent_workflows │ metrics    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                    AI Orchestrator (Existing)                      │
│  AIOrchestratorService → primary → fallback → tertiary            │
│  12 LLM providers (OpenAI, Claude, Gemini, DeepSeek, etc.)       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Admin creates Agent "Fraud Detector" with tool "scan_listing"
2. Admin creates Workflow "New Listing Review" triggered on "listing.created"
3. User creates a listing → event "listing.created" fires
4. AgentOrchestrator picks up event → runs Fraud Detector agent
5. Agent calls AI Orchestrator with system prompt + tool descriptions
6. AI Orchestrator routes to LLM (primary → fallback → tertiary)
7. Result logged to agent_metrics table
8. Gap Analyzer (Update button) periodically scans and suggests improvements
```

---

## 3. Database Schema

### 3.1 `agent_instances`

```sql
CREATE TABLE agent_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) UNIQUE NOT NULL,
  display_name    VARCHAR(255) NOT NULL,
  category        VARCHAR(50) NOT NULL DEFAULT 'custom',
  description     TEXT,
  system_prompt   TEXT,
  model_id        VARCHAR(255) DEFAULT 'gpt-4o-mini',
  provider_name   VARCHAR(255) DEFAULT 'openai',
  temperature     DECIMAL(4,2) DEFAULT 0.7,
  max_tokens      INTEGER DEFAULT 2048,
  tool_ids        TEXT[],              -- Array of agent_tool.id
  trigger_events  TEXT[],              -- Events that activate this agent
  is_enabled      BOOLEAN DEFAULT TRUE,
  status          VARCHAR(50) DEFAULT 'inactive',
  config          JSONB,
  mcp_endpoint    TEXT,
  timeout_ms      INTEGER DEFAULT 60000,
  max_retries     INTEGER DEFAULT 3,
  total_executions BIGINT DEFAULT 0,
  success_rate    DECIMAL(6,2) DEFAULT 0,
  avg_latency_ms  DECIMAL(10,2) DEFAULT 0,
  last_run_at     TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

**Categories:** `marketing`, `security`, `sales`, `support`, `crm`, `operations`, `custom`

**Statuses:** `active`, `inactive`, `degraded`, `learning`, `error`

### 3.2 `agent_tools`

```sql
CREATE TABLE agent_tools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) UNIQUE NOT NULL,   -- MCP tool name
  display_name    VARCHAR(255) NOT NULL,
  description     TEXT,
  category        VARCHAR(255) NOT NULL,
  endpoint        VARCHAR(1024) NOT NULL,          -- HTTP endpoint to call
  http_method     VARCHAR(10) DEFAULT 'GET',
  input_schema    JSONB,                           -- JSON Schema for inputs
  output_schema   JSONB,                           -- JSON Schema for outputs
  headers         JSONB,                           -- Custom HTTP headers
  examples        JSONB[],                         -- Example inputs/outputs
  is_enabled      BOOLEAN DEFAULT TRUE,
  requires_auth   BOOLEAN DEFAULT FALSE,
  timeout_ms      INTEGER DEFAULT 15000,
  total_calls     BIGINT DEFAULT 0,
  success_rate    DECIMAL(6,2) DEFAULT 100,
  last_called_at  TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### 3.3 `agent_workflows`

```sql
CREATE TABLE agent_workflows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) UNIQUE NOT NULL,
  display_name    VARCHAR(255) NOT NULL,
  description     TEXT,
  trigger         VARCHAR(50) DEFAULT 'manual',    -- manual | event | cron | api
  trigger_event   VARCHAR(255),                    -- Event name for event trigger
  cron_expression VARCHAR(255),                    -- For cron triggers
  steps           JSONB NOT NULL,                  -- WorkflowStep[]
  is_enabled      BOOLEAN DEFAULT TRUE,
  status          VARCHAR(50) DEFAULT 'inactive',
  total_runs      INTEGER DEFAULT 0,
  last_run_at     TIMESTAMP,
  last_error      TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

**WorkflowStep structure:**
```json
{
  "id": "step-uuid",
  "agentId": "agent-uuid",
  "agentName": "Fraud Detector",
  "toolId": "tool-uuid",
  "toolName": "scan_listing",
  "input": { "listingId": "{{event.payload.listingId}}" },
  "outputKey": "fraud_result",
  "condition": "{{fraud_result.risk}} > 0.7",
  "onFailure": "skip",
  "timeoutMs": 30000
}
```

**onFailure options:** `stop` (halt workflow), `skip` (continue to next step), `retry` (retry once)

### 3.4 `agent_metrics`

```sql
CREATE TABLE agent_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        VARCHAR(255) NOT NULL,
  agent_name      VARCHAR(255) NOT NULL,
  event_type      VARCHAR(255) NOT NULL,
  payload         JSONB,
  latency_ms      DECIMAL(10,2) NOT NULL,
  success         BOOLEAN NOT NULL,
  error_message   TEXT,
  cost_estimate   DECIMAL(12,6) DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_metrics_agent ON agent_metrics(agent_id);
CREATE INDEX idx_agent_metrics_time ON agent_metrics(created_at DESC);
```

---

## 4. MCP Protocol Integration

The MCP (Model Context Protocol) server exposes your application's tools to any MCP-compatible AI client. It implements the standard MCP JSON-RPC 2.0 interface over HTTP.

### 4.1 Protocol Endpoints

| Endpoint | Method | MCP Method | Description |
|----------|--------|-----------|-------------|
| `/admin/agents/mcp/tools` | GET | `tools/list` | List all enabled tools with schemas |
| `/admin/agents/mcp/call` | POST | `tools/call` | Execute a tool with arguments |

### 4.2 MCP `tools/list` Response

```json
{
  "tools": [
    {
      "name": "search_auctions",
      "description": "Search auctions by keyword, category, or price range",
      "inputSchema": {
        "type": "object",
        "properties": {
          "keyword": { "type": "string", "description": "Search term" },
          "category": { "type": "string", "description": "Category filter" },
          "minPrice": { "type": "number" },
          "maxPrice": { "type": "number" },
          "status": { "type": "string", "enum": ["active", "closed", "pending"] }
        },
        "required": ["keyword"]
      }
    },
    {
      "name": "flag_suspicious_listing",
      "description": "Flag a listing for moderation review",
      "inputSchema": {
        "type": "object",
        "properties": {
          "listingId": { "type": "string", "description": "UUID of the listing" },
          "reason": { "type": "string", "description": "Reason for flagging" }
        },
        "required": ["listingId", "reason"]
      }
    }
  ]
}
```

### 4.3 MCP `tools/call` Request/Response

**Request:**
```json
POST /admin/agents/mcp/call
{
  "name": "search_auctions",
  "arguments": {
    "keyword": "vintage car",
    "status": "active"
  }
}
```

**Success Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"status\":200,\"data\":[{\"id\":\"abc\",\"title\":\"1965 Ford Mustang\"}]}"
    }
  ]
}
```

**Error Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\":\"Tool 'unknown_tool' not found or disabled\"}"
    }
  ],
  "isError": true
}
```

### 4.4 Adding a Tool

In the Agent Studio, tools are created with:

1. **Name** — MCP tool name (e.g., `send_email_campaign`)
2. **Endpoint** — HTTP endpoint to call (e.g., `/api/email/send-campaign`)
3. **HTTP Method** — GET, POST, PUT, PATCH, DELETE
4. **Input Schema** — JSON Schema defining expected arguments
5. **Headers** — Optional custom headers

Once saved, the tool immediately appears in `tools/list` and is callable by any MCP client.

---

## 5. Agent Lifecycle

### 5.1 States

```
  [Created] → inactive → active → running → active
                  ↑          ↓         ↓
                  │      degraded   error
                  └──────────────────┘
                  (auto-recovery on next execution)
```

### 5.2 Execution Flow

```
1. Trigger received (manual API call, event, or workflow step)
2. Orchestrator loads agent config + bound tools
3. Builds prompt: system_prompt + task_input + tool_descriptions
4. Calls AIOrchestratorService.execute(agent.name, { prompt, messages })
5. AI Orchestrator routes to: primary → fallback → tertiary LLM
6. Records metric to agent_metrics table
7. Updates agent success_rate, avg_latency_ms, last_run_at
```

### 5.3 Creating an Agent

```json
POST /admin/agents/instances
{
  "name": "fraud_detector",
  "displayName": "Fraud Detector Agent",
  "category": "security",
  "systemPrompt": "You are a fraud detection specialist...",
  "modelId": "gpt-4o",
  "providerName": "openai",
  "toolIds": ["uuid-of-scan-listing", "uuid-of-flag-user"],
  "triggerEvents": ["listing.created", "user.registered"],
  "temperature": 0.3,
  "maxTokens": 4096
}
```

### 5.4 Event-Driven Activation

Agents with `triggerEvents` auto-fire when the corresponding event is emitted:

```typescript
// Anywhere in your application
await orchestrator.triggerEvent('listing.created', {
  listingId: 'abc-123',
  title: '1965 Ford Mustang',
  sellerId: 'seller-456',
  price: 50000,
});
```

This activates all agents subscribed to `listing.created` and any workflows triggered by that event.

---

## 6. Workflow Engine

### 6.1 Trigger Types

| Trigger | Description | Example |
|---------|-------------|---------|
| `manual` | Run via API call or UI button | Admin clicks "Execute" |
| `event` | Fire when a named event occurs | `listing.created` |
| `cron` | Run on a schedule | `0 */6 * * *` (every 6 hours) |
| `api` | Triggered by external API call | Webhook from payment gateway |

### 6.2 Workflow Example — New Listing Review

```json
POST /admin/agents/workflows
{
  "name": "new_listing_review",
  "displayName": "New Listing Review Pipeline",
  "trigger": "event",
  "triggerEvent": "listing.created",
  "steps": [
    {
      "id": "step-1",
      "agentId": "fraud-detector-id",
      "agentName": "Fraud Detector",
      "toolId": "scan-listing-id",
      "toolName": "scan_listing_content",
      "input": { "listingId": "{{event.payload.listingId}}", "content": "{{event.payload.title}}" },
      "outputKey": "fraud_result",
      "onFailure": "stop",
      "timeoutMs": 30000
    },
    {
      "id": "step-2",
      "agentId": "content-optimizer-id",
      "agentName": "Content Optimizer",
      "toolId": "optimize-title-id",
      "toolName": "optimize_title",
      "input": { "listingId": "{{event.payload.listingId}}" },
      "outputKey": "optimized_title",
      "onFailure": "skip",
      "timeoutMs": 20000
    },
    {
      "id": "step-3",
      "agentId": "marketing-id",
      "agentName": "Marketing Agent",
      "toolId": "schedule-social-post-id",
      "toolName": "schedule_social_post",
      "input": { "listingId": "{{event.payload.listingId}}", "title": "{{optimized_title.title}}" },
      "outputKey": "social_result",
      "onFailure": "skip",
      "timeoutMs": 15000
    }
  ]
}
```

### 6.3 Template Variables

Steps support `{{variable.path}}` syntax that resolves against:
- `event.payload.*` — data from the triggering event
- Previous step output keys — e.g., `{{fraud_result.risk}}`, `{{optimized_title.title}}`

---

## 7. Gap Analyzer & Self-Improvement

### 7.1 The "Update" Button

The **Update & Analyze** button in the Agent Studio runs a comprehensive scan:

```
POST /admin/agents/analyze
```

### 7.2 What It Checks

| Check | Severity | Description |
|-------|----------|-------------|
| Empty category | **high** | No agents configured for a category (e.g., no security agents) |
| Agent in ERROR state | **critical** | An agent has crashed and needs restart |
| Active agent, no tools | **medium** | Agent is enabled but has no tools assigned |
| Orphan tool | **low** | Tool is enabled but not bound to any agent |
| Empty workflow | **high** | Workflow is enabled but has zero steps |
| Failed workflow | **high** | Workflow in FAILED state |
| Disabled agent, wrong status | **low** | Agent is disabled but status doesn't reflect it |
| No workflows for category | **medium** | Agents exist but no workflows coordinate them |

### 7.3 Analysis Response

```json
{
  "timestamp": "2026-07-30T18:00:00Z",
  "totalGaps": 8,
  "estimatedEffort": "~4-8 hours",
  "gaps": [
    {
      "severity": "high",
      "area": "security",
      "description": "No agents configured for security category",
      "suggestedAction": "Create at least one agent for security operations"
    },
    {
      "severity": "critical",
      "area": "fraud_detector",
      "description": "Agent fraud_detector is in ERROR state",
      "suggestedAction": "Check agent logs and configuration, then restart"
    }
  ],
  "recommendations": [
    {
      "type": "new_agent",
      "description": "Add security agents: Fraud Detector, Content Moderator, Access Auditor",
      "implementation": "Use the agent creation wizard to add recommended agents"
    }
  ],
  "coverage": {
    "categories": {
      "marketing": { "agents": 2, "tools": 4, "workflows": 1, "coverage": "partial" },
      "security": { "agents": 0, "tools": 0, "workflows": 0, "coverage": "none" },
      "sales": { "agents": 1, "tools": 3, "workflows": 0, "coverage": "partial" }
    },
    "orphanTools": 2,
    "inactiveAgents": 3,
    "brokenWorkflows": 1
  }
}
```

### 7.4 Template-Driven Suggestions

The analyzer includes templates for each category. When a category is empty, it suggests:

| Category | Suggested Agents | Suggested Tools |
|----------|-----------------|-----------------|
| **marketing** | Campaign Agent, Social Media Agent, Content Generator, SEO Optimizer | send_email, generate_social_post, analyze_campaign_metrics, schedule_content |
| **security** | Fraud Detector, Content Moderator, Access Auditor | flag_user, suspend_account, scan_listing_content, audit_access_logs |
| **sales** | Sales Assistant, Listing Optimizer, Pricing Advisor | create_promotion, update_pricing, generate_listing_description, send_offer |
| **support** | Customer Support, FAQ Bot, Ticket Resolution | search_faq, create_ticket, send_support_response, escalate_issue |
| **crm** | Lead Manager, Buyer Engagement, Seller Retention | create_contact, send_follow_up, update_contact_status, log_interaction |
| **operations** | Inventory Manager, Payment Reconciliation, Report Generator | sync_inventory, reconcile_payments, generate_report, schedule_task |

---

## 8. API Reference

### Base URL: `/api/admin/agents`

All endpoints require `Authorization: Bearer <JWT>` and `super_admin` role.

### Agent Instances

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/instances` | List all agent instances |
| `GET` | `/instances/:id` | Get agent by ID |
| `POST` | `/instances` | Create agent |
| `PATCH` | `/instances/:id` | Update agent |
| `DELETE` | `/instances/:id` | Delete agent |
| `POST` | `/instances/:id/toggle` | Toggle enable/disable |
| `POST` | `/instances/:id/execute` | Execute agent manually |

### Tools

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tools` | List all tools |
| `GET` | `/tools/:id` | Get tool by ID |
| `POST` | `/tools` | Create tool |
| `PATCH` | `/tools/:id` | Update tool |
| `DELETE` | `/tools/:id` | Delete tool |

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/workflows` | List all workflows |
| `GET` | `/workflows/:id` | Get workflow by ID |
| `POST` | `/workflows` | Create workflow |
| `PATCH` | `/workflows/:id` | Update workflow |
| `DELETE` | `/workflows/:id` | Delete workflow |
| `POST` | `/workflows/:id/execute` | Execute workflow manually |

### Orchestration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/trigger` | Trigger event: `{ eventType, payload }` |
| `POST` | `/discover` | Auto-discover capabilities & gaps |
| `POST` | `/analyze` | **Update button** — full gap analysis |

### MCP Protocol

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/mcp/tools` | MCP `tools/list` — enabled tools with schemas |
| `POST` | `/mcp/call` | MCP `tools/call` — execute tool: `{ name, arguments }` |

### Metrics & Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard` | Overall stats (agents, tools, workflows, success rate) |
| `GET` | `/metrics?agentId=:id` | Execution metrics, optionally filtered by agent |

---

## 9. Implementation Guide

### 9.1 Prerequisites

- NestJS 10+ (or any Node.js framework — adapt the patterns)
- TypeORM 0.3+ (or any ORM — 4 entities, ~30 columns total)
- Existing AI/LLM orchestrator (GreyAuction uses its model-agnostic AI module with 12 providers)
- PostgreSQL (JSONB columns used; can adapt to MySQL JSON or MongoDB)

### 9.2 File Structure

```
backend/src/agents/
├── agents.module.ts                    # NestJS module — imports entities + AI module
├── agents.controller.ts                # 25 REST endpoints + MCP protocol
├── agents.service.ts                   # CRUD for agents, tools, workflows, metrics
├── agent-orchestrator.service.ts       # Execution engine + event bus
├── agent-gap-analyzer.service.ts       # Gap analysis + template suggestions
├── entities/
│   ├── agent-instance.entity.ts        # Agent profiles
│   ├── agent-tool.entity.ts            # Tool registry with JSON schemas
│   ├── agent-workflow.entity.ts        # Multi-step workflow definitions
│   └── agent-metric.entity.ts          # Execution logs + success tracking
├── dto/
│   ├── agent.dto.ts                    # CreateAgentDto, UpdateAgentDto
│   └── tool-workflow.dto.ts            # CreateToolDto, CreateWorkflowDto, UpdateWorkflowDto
└── mcp/
    └── mcp.server.ts                   # MCP JSON-RPC implementation

frontend/app/[locale]/(domain)/admin/agents/
├── page.tsx                            # Agent Studio dashboard
├── loading.tsx                         # Skeleton loading state
├── instances/
│   ├── page.tsx                        # Agent list
│   └── [agentId]/page.tsx              # Agent detail (extends studio)
├── tools/
│   ├── page.tsx                        # Tool list
│   └── [toolId]/page.tsx               # Tool editor
├── workflows/
│   ├── page.tsx                        # Workflow list
│   └── [workflowId]/page.tsx           # Workflow editor
├── monitoring/
│   └── page.tsx                        # Metrics dashboard
└── _islands/
    ├── agent_dashboard.tsx             # Main dashboard with Update button
    └── agents-api.ts                   # API client functions
```

### 9.3 Module Registration

```typescript
// app.module.ts
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [
    // ... other modules
    AgentsModule,  // ← Add this
  ],
})
export class AppModule {}
```

### 9.4 Admin Sidebar Entry

```tsx
// admin_sidebar.tsx
{
  label: 'AGENT STUDIO',
  items: [
    { icon: Bot, label: 'Agent Studio', path: '/admin/agents' },
    { icon: Wrench, label: 'Tools', path: '/admin/agents/tools' },
    { icon: Workflow, label: 'Workflows', path: '/admin/agents/workflows' },
  ],
}
```

### 9.5 Minimum Setup for a New Application

```bash
# 1. Copy the agents/ directory to your NestJS project
cp -r greyauction/backend/src/agents/ your-project/src/

# 2. Register in your app module (see §9.3)

# 3. The 4 entity tables auto-create if synchronize:true
#    Or run: npm run migration:generate -- --name CreateAgentTables

# 4. Access the dashboard at /admin/agents

# 5. Create your first tool:
POST /admin/agents/tools
{
  "name": "get_weather",
  "displayName": "Get Weather",
  "category": "operations",
  "endpoint": "https://api.weather.com/v1/current",
  "httpMethod": "GET",
  "inputSchema": {
    "type": "object",
    "properties": { "city": { "type": "string" } },
    "required": ["city"]
  }
}

# 6. Create an agent that uses the tool:
POST /admin/agents/instances
{
  "name": "weather_analyst",
  "displayName": "Weather Analyst",
  "category": "operations",
  "systemPrompt": "You analyze weather data and provide recommendations...",
  "toolIds": ["uuid-of-get-weather"]
}

# 7. Hit the Update button to analyze gaps
POST /admin/agents/analyze
```

---

## 10. Connecting Hermes Agent

### 10.1 Why Hermes?

[Hermes Agent](https://github.com/NousResearch/hermes-agent) by Nous Research is a self-improving AI agent with:
- Built-in learning loop (creates skills, improves them during use)
- MCP client support — connects to your MCP server
- Multi-platform messaging (Telegram, Discord, Slack, WhatsApp, Signal, CLI)
- Cron scheduling, subagent spawning, persistent memory

### 10.2 Configuration

Create or edit Hermes's MCP config:

```yaml
# ~/.hermes/mcp_servers.yml (or via hermes mcp add)
mcp_servers:
  greyauction:
    transport: http
    url: https://your-api.com/api/admin/agents/mcp
    # If your API needs auth, add headers:
    # headers:
    #   Authorization: "Bearer YOUR_JWT_TOKEN"
```

Then in Hermes CLI:

```bash
hermes mcp list            # Should show all your enabled tools
hermes mcp call greyauction search_auctions '{"keyword":"vintage car"}'
```

### 10.3 Multi-Agent Setup

Create multiple Hermes "personalities" pointing to different agent profiles:

```yaml
# hermes personalities.yml
personalities:
  auction_assistant:
    model: openai/gpt-4o-mini
    system_prompt: "You are GreyAuction's customer assistant..."
    mcp_servers: [greyauction]
    tools: [search_auctions, get_auction_details, place_bid]

  fraud_analyst:
    model: anthropic/claude-sonnet-4-20250514
    system_prompt: "You are a fraud analyst..."
    mcp_servers: [greyauction]
    tools: [scan_listing_content, flag_user, audit_access_logs]
    schedule: "0 */4 * * *"  # Run every 4 hours
```

### 10.4 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      Hermes Agent (Python)                     │
│                                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │ Assistant   │  │ Fraud      │  │ Marketing  │               │
│  │ Personality │  │ Analyst    │  │ Campaign   │               │
│  └──────┬──────┘  └──────┬─────┘  └──────┬─────┘               │
│         │                │               │                     │
│         └────────────────┼───────────────┘                     │
│                          │                                     │
│                   MCP Protocol                                 │
│              (JSON-RPC 2.0 over HTTP)                          │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────┐
│                GreyAuction MCP Server (NestJS)                 │
│                                                                │
│  GET  /admin/agents/mcp/tools    →  list all enabled tools    │
│  POST /admin/agents/mcp/call     →  execute a tool            │
│                                                                │
│  Tools exposed:                                                │
│  search_auctions | get_auction_details | create_auction       │
│  place_bid | flag_listing | send_email | generate_report      │
│  scan_content | audit_logs | update_inventory | ...           │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Extending for Other Applications

### 11.1 Adapting the Category Templates

The gap analyzer has category templates. Edit `agent-gap-analyzer.service.ts` to match your domain:

```typescript
private readonly CATEGORY_TEMPLATES = {
  // Example: Healthcare app
  clinical: {
    suggestedAgents: ['Diagnosis Assistant', 'Treatment Planner', 'Drug Interaction Checker'],
    suggestedTools: ['search_patient_records', 'check_drug_interactions', 'schedule_appointment'],
  },
  billing: {
    suggestedAgents: ['Claims Processor', 'Invoice Auditor', 'Payment Follow-up'],
    suggestedTools: ['submit_claim', 'verify_coverage', 'generate_invoice'],
  },
  // Add your domain categories here
};
```

### 11.2 Adding Custom Agent Categories

```typescript
// In agent-instance.entity.ts
export enum AgentCategory {
  // GreyAuction defaults
  MARKETING = 'marketing',
  SECURITY = 'security',
  SALES = 'sales',
  SUPPORT = 'support',
  CRM = 'crm',
  OPERATIONS = 'operations',
  CUSTOM = 'custom',
  // Add your own:
  HEALTHCARE = 'healthcare',
  LEGAL = 'legal',
  FINANCE = 'finance',
  LOGISTICS = 'logistics',
}
```

### 11.3 Using Without NestJS

The core logic is framework-agnostic. Extract the key services:

```
your-app/
├── agents/
│   ├── agent-service.ts       ← CRUD (adapter for your ORM)
│   ├── orchestrator.ts        ← Execute agents + trigger events
│   ├── gap-analyzer.ts        ← Analysis + templates
│   ├── mcp-server.ts          ← MCP JSON-RPC handler
│   └── types.ts               ← TypeScript interfaces
```

The MCP server can run standalone:

```typescript
// standalone-mcp-server.ts
import express from 'express';
import { MCPServerService } from './agents/mcp-server';
import { AgentService } from './agents/agent-service';

const app = express();
const service = new AgentService(/* your DB connection */);
const mcp = new MCPServerService(service);

app.get('/mcp/tools', async (req, res) => {
  res.json(await mcp.listTools());
});

app.post('/mcp/call', express.json(), async (req, res) => {
  const { name, arguments: args } = req.body;
  res.json(await mcp.callTool(name, args));
});

app.listen(4000, () => console.log('MCP Server on :4000'));
```

### 11.4 Adding to Non-Admin Frontend

For public-facing agent features (chatbot, recommendation engine):

```tsx
// In your public page
import { useAIFeature } from '@/shared/hooks/use-ai-feature';

function AuctionDescriptionGenerator() {
  const { execute, result, isLoading } = useAIFeature({
    featureKey: 'auction_description_generator',
  });

  return (
    <div>
      <button onClick={() => execute({ title, specs, category })} disabled={isLoading}>
        Generate Description
      </button>
      {result && <textarea value={result} />}
    </div>
  );
}
```

### 11.5 Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Tool endpoint injection | Validate `endpoint` format; restrict to internal API paths in production |
| API key exposure | Agent `config` JSONB field supports encrypted values; rotate regularly |
| Rate limiting | Use existing AI module rate limiter; add per-agent limits |
| Event spam | Deduplicate events by type+payload hash within a time window |
| MCP access control | The MCP endpoints inherit `@AdminRoles(SUPER_ADMIN)` guard; for public access, add API key auth |

---

## Appendix A: Quick-Start Checklist

- [ ] Copy `backend/src/agents/` to your project
- [ ] Register `AgentsModule` in `app.module.ts`
- [ ] Run migration (or rely on `synchronize: true` for dev)
- [ ] Add sidebar entry to admin panel
- [ ] Create 2-3 tools (API endpoints your agents will call)
- [ ] Create your first agent with a system prompt + bound tools
- [ ] Execute the agent manually: `POST /instances/:id/execute`
- [ ] Hit the **Update** button: `POST /analyze`
- [ ] Create a workflow for multi-step automation
- [ ] Wire up event triggers in your business logic
- [ ] Configure Hermes Agent MCP connection
- [ ] Monitor metrics: `GET /metrics`

## Appendix B: Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `API_URL` | Internal API base URL (for tool endpoint resolution) | `http://localhost:3001/api` |
| `MCP_SERVER_ENABLED` | Enable/disable MCP server | `true` |
| `AGENT_DEFAULT_MODEL` | Default LLM for new agents | `gpt-4o-mini` |
| `AGENT_DEFAULT_PROVIDER` | Default LLM provider | `openai` |
| `AGENT_MAX_CONCURRENT` | Max concurrent agent executions | `5` |

## Appendix C: Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Agent stuck in `error` | LLM call failed or tool timeout | Check metrics table for error message; verify tool endpoint is reachable |
| Workflow not triggering | Event name mismatch | Verify `triggerEvent` matches exactly what your code emits |
| MCP `tools/list` returns empty | No tools enabled | Enable tools in Agent Studio or check `isEnabled` flag |
| Gap analyzer shows no suggestions | All categories covered | This is normal — try disabling an agent and re-running |
| High latency | LLM provider slow or tool timeout too high | Reduce `maxTokens`, switch to faster model, lower tool `timeoutMs` |

---

> **Built for GreyAuction.** Adaptable to any application that needs AI agent orchestration.  
> **License:** MIT — use freely in your own projects.
