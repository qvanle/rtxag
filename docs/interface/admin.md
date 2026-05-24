# Admin Interface Description

## Overview
The Admin Interface is a dark-mode Aurora UI for platform-level operations, built with Vite + React + TypeScript and styled with custom CSS glassmorphism. The visual style uses deep navy backgrounds, blue gradients, translucent panels, soft glows, and high-contrast text for a high-technology look.

The interface is designed for a **System Admin** persona to manage global AI infrastructure and monitor tenant operations.

## Navigation
The sidebar navigation contains 5 modules:
- Dashboard
- Assistant
- Model
- Retrieval
- MCP

## Layout and Visual System
- **Shell:** Two-column layout with persistent left sidebar and top status bar.
- **Theme:** Dark Aurora palette (dark blue primary), glass cards, blur overlays, subtle motion.
- **Components:** Reusable cards, tables, status badges, action buttons, tabs, and modal overlays.
- **Responsiveness:** Desktop-first with responsive collapse behavior for tablet/mobile.

## Module Details

### 1) Dashboard
Purpose: System observability across global and tenant scopes.

Key behavior:
- Scope switcher with two views:
  - **Global:** KPI tiles (token consumption, cost, error rate, latency), traffic/health panels.
  - **Per Tenant:** Tenant usage table with plan, status, users, and token consumption.

### 2) Assistant
Purpose: Manage assistants that are composed from Models, Retrieval collections, and MCP collections.

Data model:
- Assistants exist in 2 scopes:
  - **Global assistants**
  - **Per tenant assistants**
- Each assistant references:
  - One or more Models
  - One or more Retrieval collections
  - One or more MCP collections

Key behavior:
- Scope-based browsing (Global / Per Tenant).
- Create and edit assistant composition by selecting linked Models, Retrieval collections, and MCP collections.
- Status and version visibility per assistant.

### 3) Model
Purpose: Central model registry and provider control surface.

Key behavior:
- Global model table (name, version, status, updated date).
- Add/edit model flow.
- **Provider management embedded in this tab**:
  - Provider table with environment, priority, masked API key, and status.
  - Enable/disable provider actions for fallback routing control.

### 4) Retrieval
Purpose: Manage retrieval as collection-based knowledge stores.

Data model:
- Retrieval is organized into collections in 2 scopes:
  - **Global collections**
  - **Per tenant collections**
- Each Retrieval collection has:
  - A selected embedding model (chosen from Model module)
  - Many documents
- Documents in a collection are indexed using that collection's selected embedding model.

Key behavior:
- Scope-based collection listing (Global / Per Tenant).
- Create/edit collection with embedding model selection.
- Manage documents within each collection and track indexing status.

### 5) MCP
Purpose: Manage MCP as collection-based records.

Data model:
- MCP is organized into collections in 2 scopes:
  - **Global collections**
  - **Per tenant collections**
- Each MCP collection contains many records.

Key behavior:
- Scope-based collection listing (Global / Per Tenant).
- Create/edit MCP collections.
- Browse and manage records inside each collection.

## Data and Interactions
- Current implementation uses typed local mock data.
- CRUD and lifecycle actions are UI-level mocked flows (no backend API integration yet).
- Status badges communicate entity state (`active`, `draft`, `deprecated`, `archived`, etc.).

## Current Scope
Included:
- IA, navigation, responsive layout, visual system, module screens, and mocked interactions.

Not yet included:
- Authentication/authorization flows.
- Real API integration and persistence.
- Server-side validation and audit payload detail views.
