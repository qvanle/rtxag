# ORM Plan

## Objective
Implement repository persistence for remaining domains while preserving SQL migration authority.

## Current State
- Migrations exist and run at startup.
- GORM models exist for all core tables.
- Model/Provider repositories exist.

## Target State
- Retrieval/MCP/Assistant/Dashboard query repositories implemented.
- Migration runner remains stable for multi-statement SQL and plpgsql blocks.

## Work Items
- Add retrieval repository (collections/documents/reindex markers).
- Add mcp repository (collections/records).
- Add assistant repository with link-table operations in transaction.
- Add dashboard repository for aggregate reads from metrics tables.
- Add migration-safe checks for new SQL changes.

## Dependencies
- Existing `orm/models` and migration files.
- Service repository interfaces.

## Acceptance Criteria
- Repositories satisfy service interfaces without stubs.
- Transactional assistant operations are atomic.

## Assumptions
- No AutoMigrate-only production path; SQL migrations remain primary.
