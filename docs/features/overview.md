# Feature Overview

This document summarizes platform features by role.
Detailed specifications are in:
- `docs/features/system.md`
- `docs/features/tenant-moderator.md`
- `docs/features/tenant-user.md`

## 1) System Role (Platform Admin)
Scope: Global platform governance across all tenants.

- **Core Entity Management (Global):** CRUD default LLM models, RAG, MCP, and Agents.
- **System Playground:** Platform-level testing and debugging.
- **Tenant & Billing Management:** Create/suspend/delete tenants; configure pricing tiers (Free, Pro, Enterprise) and resource limits (rate limits, storage, max agents).
- **Provider Management:** Manage global API keys (OpenAI, Anthropic, etc.) and fallback routing.
- **Global Observability & Analytics:** Track token consumption, tenant costs, and API error rates.
- **System Knowledge Base:** Manage global vector databases and public documentation shared across tenants.
- **Audit Logs:** Track critical system-level changes and administrative actions.

## 2) Tenant Moderator (Organization Admin)
Scope: Organization-level configuration and governance within one tenant.

- **Inheritance & Customization:** Inherit global defaults; override prompts/config and attach custom tools.
- **Core Entity Management (Tenant Scope):** CRUD internal LLM models, RAG, MCP, and Agents for the organization.
- **Tenant Playground:** Internal testing environment for custom agents.
- **Identity & Access Management (IAM):** Invite/remove Tenant Users and enforce RBAC for agents/knowledge.
- **Tenant Analytics & Quota Control:** Monitor token usage by user/department; define budget caps and alerts.
- **Advanced RAG & Knowledge Management:**
  - Manage data connectors (Notion, Google Drive, Jira).
  - Configure chunking strategies and evaluate retrieval quality.
- **Prompt & Agent Versioning:** Maintain version history and run A/B tests before organization-wide rollout.

## 3) Tenant User (End User / Employee)
Scope: Daily AI consumption and personal productivity.

- **Consumption Interface:** Multimodal chat UI with `@mention` support for agents or MCP tools in one thread.
- **Session & Memory Management:** Chat history, semantic search, pinned threads, and personal AI memory.
- **Personal Knowledge (Local RAG):** Upload private files for ad-hoc queries without polluting organization/global RAG.
- **Feedback Loop:** Rate responses (thumbs up/down) and report hallucinations for moderator follow-up.
- **Prompt Library:** Save personal prompt templates and use shared templates curated by the organization.
