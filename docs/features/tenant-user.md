# Tenant User Features (End User / Employee)

## 1) Role Definition
The **Tenant User** role is the primary consumer of AI capabilities within an organization. It focuses on efficient task completion, safe knowledge access, and personalized experience.

### Primary Responsibilities
- Interact with agents and tools through chat.
- Manage personal sessions, preferences, and memory.
- Use personal knowledge uploads for private ad-hoc tasks.
- Provide feedback to improve agent quality over time.

### Out of Scope
- Administrative configuration of tenant/global entities.
- Billing, IAM policy, and provider management.

---

## 2) Consumption Interface
Multimodal chat interface for daily AI usage.

### Functional Details
- Send text and file/image inputs (subject to tenant policy).
- @mention specific agents and MCP tools in a single thread.
- Switch context between general assistant and specialized agents.
- View tool usage traces in user-readable format when permitted.

### UX Requirements
- Fast response rendering with clear loading/error states.
- Conversation-level indicators for active agent/tool context.
- Citation/source visibility for retrieval-backed answers.

---

## 3) Session & Memory Management
Tools for continuity and personalization across conversations.

### Session Features
- Persist chat history with searchable conversation titles/content.
- Pin important threads for quick access.
- Organize sessions by tags, project, or recency.

### Personal AI Memory
- User-defined memory preferences (e.g., preferred tech stack/style).
- Memory edit/delete controls for transparency and control.
- Memory usage indicators when responses are personalized.

### Privacy Controls
- Users can clear thread history within policy constraints.
- Personal memory remains scoped to the user identity.

---

## 4) Personal Knowledge (Local RAG)
Private document upload and retrieval for individual use cases.

### Functional Details
- Upload files for ad-hoc question answering.
- Index personal documents in a user-scoped retrieval store.
- Query personal files without exposing data to org-global KB by default.

### Governance Rules
- File size/type limits enforced by tenant policy.
- Malware/content scanning before indexing (if enabled).
- Retention and auto-expiry configurable by tenant policy.

### Transparency
- Show indexing status and retrieval source at response time.
- Allow delete/re-index of personal documents.

---

## 5) Feedback Loop
Mechanisms to improve response quality and trust.

### Feedback Actions
- Rate responses (thumbs up/down).
- Submit issue reports (hallucination, harmful output, irrelevant answer).
- Add optional context notes to aid moderator triage.

### Workflow Integration
- Feedback events are routed to tenant moderators/admin dashboards.
- Critical reports can be auto-prioritized by severity tags.

### Audit Events
- `user.feedback.submitted`
- `user.response.rated`

---

## 6) Prompt Library
Reusable prompt templates for productivity.

### Functional Details
- Save personal prompt templates with tags/categories.
- Reuse/edit templates directly from the chat composer.
- Access shared prompt templates curated by organization moderators.

### Access Model
- Personal templates are private by default.
- Shared templates are read-only unless user has contributor rights.

---

## 7) Permissions Matrix (Tenant User)
| Capability | Tenant User |
|---|---|
| Chat with agents/tools | Allowed |
| Upload/use personal files (Local RAG) | Allowed (policy-bound) |
| Manage own sessions/memory | Allowed |
| Submit feedback and ratings | Allowed |
| Use shared prompt library | Allowed |
| Manage tenant entities and IAM | Not allowed |

---

## 8) Non-Functional Requirements
- **Performance:** Interactive response times suitable for daily workflows.
- **Privacy:** Strong separation of personal uploads and organization/global data.
- **Reliability:** Stable session persistence and history retrieval.
- **Accessibility:** Usable chat interface across desktop/mobile.
- **Explainability:** Clear source/citation and feedback paths.

---

## 9) Acceptance Criteria (High-Level)
- User can @mention agents/tools and receive contextual responses.
- User can search, pin, and revisit previous conversations.
- User can define and manage personal memory preferences.
- User can upload personal files and query them privately.
- User can submit quality feedback and issue reports.
- User can save personal prompts and use organization-shared templates.
