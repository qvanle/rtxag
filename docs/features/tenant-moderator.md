# Tenant Moderator Features (Organization Admin)

## 1) Role Definition
The **Tenant Moderator** role (Organization Admin) manages organization-specific AI resources, users, access controls, and governance within a single tenant.

### Primary Responsibilities
- Inherit global defaults and customize tenant-level configurations.
- Manage tenant-scoped entities (models, RAG, MCP, agents).
- Administer tenant users, roles, and access policies.
- Monitor tenant usage and enforce budget/quota controls.
- Operate organization knowledge ingestion and agent/prompt lifecycle.

### Out of Scope
- Cross-tenant infrastructure and billing-plan definition.
- Global provider credential management.

---

## 2) Inheritance & Customization
Tenant Moderator can consume system defaults and apply tenant-specific overrides.

### Functional Details
- Browse inherited global entities with read-only provenance metadata.
- Override selected configuration fields (system prompts, tools, routing policies).
- Attach tenant-specific tools/MCP resources to inherited agents.
- Reset customized resources back to inherited defaults.

### Governance Rules
- Inherited baseline remains immutable at tenant level.
- Overrides are versioned and include `changed_by`, `changed_at`, and change notes.
- Protected global entities marked `system_required` cannot be removed.

### Audit Events
- `tenant.override.created`
- `tenant.override.updated`
- `tenant.override.reverted`

---

## 3) Core Entity Management (Tenant Scope)
Tenant Moderator can CRUD tenant-specific:
- LLM Models
- RAG Configurations
- MCP Servers/Tools
- Agents

### Functional Details
- Create internal entities visible only within the organization.
- Define ownership and access scope per entity (private/team/org).
- Version entities and support lifecycle states: `draft` -> `active` -> `deprecated` -> `archived`.
- Clone inherited or existing entities for faster customization.

### Validation Rules
- Name uniqueness within tenant namespace.
- Required metadata before activation.
- Breaking edits require a new version.

### Audit Events
- `tenant.entity.created`
- `tenant.entity.updated`
- `tenant.entity.deleted`
- `tenant.entity.activated`

---

## 4) Tenant Playground
Internal testing environment for validating tenant configurations.

### Functional Details
- Test agents/prompts/tools with tenant-scoped data and permissions.
- Compare model responses and tool-call traces.
- Save test scenarios before broad rollout.
- Tag runs by team, use case, and candidate version.

### Guardrails
- Sandbox-like execution policy for risky tools.
- Tenant data isolation enforced for all tests.

---

## 5) Identity & Access Management (IAM)
Manage users and access policies inside the tenant.

### User Administration
- Invite users via email/domain policy.
- Remove/deactivate users.
- Assign roles (Moderator, User, optional custom roles).

### Access Control
- Enforce RBAC at resource level (agents, knowledge bases, prompt libraries).
- Grant/revoke permissions per user/team.
- Support default permission templates for rapid onboarding.

### Security Controls
- Optional SSO/SAML enforcement (if enabled by platform).
- Session policy controls (max session age, forced re-auth).

### Audit Events
- `tenant.user.invited`
- `tenant.user.removed`
- `tenant.role.assigned`
- `tenant.permission.updated`

---

## 6) Tenant Analytics & Quota Control
Visibility and controls for usage, budget, and operational efficiency.

### Metrics
- Token usage by user, team, agent, and model.
- Cost estimation by department/project.
- Error rates and latency trends for tenant workloads.

### Controls
- Set budget caps by user/team/project.
- Configure alerts for threshold breaches.
- Apply usage throttles when limits are reached.

### Reporting
- Export usage and cost data for internal finance/ops.
- Compare usage periods for planning and optimization.

---

## 7) Advanced RAG & Knowledge Management
Operate tenant knowledge pipelines and retrieval quality.

### Data Connectors
- Configure and sync connectors (Notion, Google Drive, Jira).
- Schedule sync frequencies and handle incremental updates.
- Track sync health and failure diagnostics.

### Retrieval Configuration
- Configure chunking strategies and embedding options.
- Define collection-level metadata and access scope.
- Evaluate retrieval quality using curated test queries.

### Data Governance
- Exclude sensitive sources from organization-wide retrieval.
- Apply retention and source freshness policies.

### Audit Events
- `tenant.connector.created`
- `tenant.connector.synced`
- `tenant.rag.config.updated`

---

## 8) Prompt & Agent Versioning
Control safe rollout of prompt and agent changes.

### Version Management
- Maintain version history with author, reason, and diff summary.
- Tag stable releases and deprecate outdated versions.
- Roll back to prior stable versions when regressions occur.

### Validation & Rollout
- Run A/B tests against defined success metrics.
- Perform staged rollout by team/percentage before org-wide release.
- Require approval workflow for high-impact changes (optional policy).

### Audit Events
- `tenant.prompt.version.created`
- `tenant.agent.version.released`
- `tenant.agent.rollout.updated`

---

## 9) Permissions Matrix (Tenant Moderator)
| Capability | Tenant Moderator |
|---|---|
| Inherit global entities | Full (read/inherit) |
| Override tenant configuration | Full |
| Manage tenant entities (LLM/RAG/MCP/Agents) | Full |
| Manage tenant users and RBAC | Full |
| Configure tenant budgets/alerts | Full |
| Manage tenant connectors and RAG quality | Full |
| Manage prompt/agent versions and rollout | Full |

---

## 10) Non-Functional Requirements
- **Security:** Strict tenant isolation and role-based enforcement.
- **Reliability:** Resilient connector sync and recoverable job execution.
- **Scalability:** Stable performance with growing users, data, and agents.
- **Traceability:** Full audit trail for all privileged tenant actions.
- **Usability:** Clear override/inheritance visibility to reduce misconfiguration.

---

## 11) Acceptance Criteria (High-Level)
- Moderator can inherit global resources and apply tenant-specific overrides.
- Moderator can CRUD tenant entities with version/lifecycle management.
- Moderator can invite/remove users and enforce RBAC on key resources.
- Budget caps and usage alerts are configurable and trigger correctly.
- Connectors can sync and expose diagnostics for failures.
- Prompt/agent A/B testing and staged rollout are supported with rollback.
