# Risk Register

## R1: API Contract Drift
- Risk: docs contract diverges from implemented request/response fields.
- Impact: client integration failures.
- Mitigation: maintain implementation status in docs/api/admin.md and review per release.
- Status: open.

## R2: Migration Regression
- Risk: SQL migration changes break startup or existing data.
- Impact: service boot failure.
- Mitigation: migration tests + compose smoke before merge.
- Status: open.

## R3: Tenant Scope Leakage
- Risk: tenant/global filtering bugs expose wrong data.
- Impact: high security issue.
- Mitigation: service/repo tests for scope constraints and header enforcement.
- Status: open.

## R4: Assistant Composition Inconsistency
- Risk: partial writes in assistant link tables.
- Impact: broken assistant configs.
- Mitigation: strict transactions + rollback tests.
- Status: open.

## R5: LLMHub Runtime Misconfiguration
- Risk: invalid hex AES key or missing env values.
- Impact: llmhub crash loop.
- Mitigation: explicit env docs and startup checklist.
- Status: mitigated (documented), still monitor.
