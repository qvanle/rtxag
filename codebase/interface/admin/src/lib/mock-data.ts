export type Scope = "global" | "tenant";
export type Status = "active" | "draft" | "deprecated" | "archived";

export const tenants = [
  { id: "t1", name: "Acme Corp", plan: "Enterprise", status: "active", users: 1248, tokens: 12_450_000 },
  { id: "t2", name: "Globex", plan: "Pro", status: "active", users: 432, tokens: 4_120_000 },
  { id: "t3", name: "Initech", plan: "Starter", status: "suspended", users: 28, tokens: 180_000 },
  { id: "t4", name: "Umbrella", plan: "Enterprise", status: "active", users: 920, tokens: 8_900_000 },
  { id: "t5", name: "Hooli", plan: "Pro", status: "trial", users: 76, tokens: 540_000 },
];

export const kpis = {
  tokens: { value: "62.4M", delta: "+12.3%" },
  cost: { value: "$48,210", delta: "+5.8%" },
  errorRate: { value: "0.42%", delta: "-0.12%" },
  latency: { value: "284ms", delta: "-18ms" },
};

export const trafficSeries = [
  18, 22, 19, 28, 35, 31, 42, 48, 55, 51, 60, 72, 68, 74, 82, 79, 88, 95, 91, 86, 78, 70, 64, 58,
];

export type Assistant = {
  id: string;
  name: string;
  scope: Scope;
  tenant?: string;
  models: string[];
  retrieval: string[];
  tools: string[];
  status: Status;
  version: string;
};

export const assistants: Assistant[] = [
  { id: "a1", name: "Support Copilot", scope: "global", models: ["gpt-4o", "claude-3.5"], retrieval: ["product-docs"], tools: ["zendesk-tools"], status: "active", version: "v2.4" },
  { id: "a2", name: "Sales Researcher", scope: "global", models: ["gpt-4o"], retrieval: ["market-intel"], tools: ["salesforce"], status: "active", version: "v1.8" },
  { id: "a3", name: "Internal Wiki Bot", scope: "tenant", tenant: "Acme Corp", models: ["claude-3.5"], retrieval: ["wiki-acme"], tools: [], status: "draft", version: "v0.3" },
  { id: "a4", name: "Legal Review", scope: "tenant", tenant: "Umbrella", models: ["gpt-4o"], retrieval: ["legal-corpus"], tools: ["docusign"], status: "active", version: "v3.1" },
  { id: "a5", name: "Onboarding Guide", scope: "global", models: ["llama-3.1"], retrieval: ["product-docs"], tools: [], status: "deprecated", version: "v1.0" },
];

export type Model = {
  id: string;
  name: string;
  provider: string;
  version: string;
  status: Status;
  updated: string;
};

export const models: Model[] = [
  { id: "m1", name: "gpt-4o", provider: "OpenAI", version: "2024-11", status: "active", updated: "2026-05-12" },
  { id: "m2", name: "claude-3.5-sonnet", provider: "Anthropic", version: "20241022", status: "active", updated: "2026-04-30" },
  { id: "m3", name: "llama-3.1-70b", provider: "Meta", version: "instruct", status: "active", updated: "2026-03-18" },
  { id: "m4", name: "text-embedding-3-large", provider: "OpenAI", version: "v3", status: "active", updated: "2026-02-02" },
  { id: "m5", name: "mistral-large", provider: "Mistral", version: "2407", status: "draft", updated: "2026-05-20" },
  { id: "m6", name: "gpt-3.5-turbo", provider: "OpenAI", version: "0125", status: "deprecated", updated: "2025-11-10" },
];

export type Provider = {
  id: string;
  name: string;
  env: "production" | "staging";
  priority: number;
  apiKey: string;
  status: "enabled" | "disabled";
};

export const providers: Provider[] = [
  { id: "p1", name: "OpenAI", env: "production", priority: 1, apiKey: "sk-••••••••••••a92f", status: "enabled" },
  { id: "p2", name: "Anthropic", env: "production", priority: 2, apiKey: "sk-ant-••••••••12d4", status: "enabled" },
  { id: "p3", name: "Azure OpenAI", env: "production", priority: 3, apiKey: "az-••••••••••••77c1", status: "enabled" },
  { id: "p4", name: "Mistral", env: "staging", priority: 4, apiKey: "ms-••••••••••55bb", status: "disabled" },
];

export type RetrievalCollection = {
  id: string;
  name: string;
  scope: Scope;
  tenant?: string;
  embeddingModel: string;
  docs: number;
  status: Status;
  updated: string;
};

export const retrievalCollections: RetrievalCollection[] = [
  { id: "r1", name: "product-docs", scope: "global", embeddingModel: "text-embedding-3-large", docs: 1284, status: "active", updated: "2026-05-22" },
  { id: "r2", name: "market-intel", scope: "global", embeddingModel: "text-embedding-3-large", docs: 642, status: "active", updated: "2026-05-19" },
  { id: "r3", name: "wiki-acme", scope: "tenant", tenant: "Acme Corp", embeddingModel: "text-embedding-3-large", docs: 3120, status: "active", updated: "2026-05-23" },
  { id: "r4", name: "legal-corpus", scope: "tenant", tenant: "Umbrella", embeddingModel: "text-embedding-3-large", docs: 8420, status: "active", updated: "2026-05-15" },
  { id: "r5", name: "onboarding-kit", scope: "global", embeddingModel: "text-embedding-3-large", docs: 96, status: "draft", updated: "2026-05-10" },
];

export type Document = {
  id: string;
  title: string;
  collection: string;
  size: string;
  status: "indexed" | "indexing" | "failed";
  updated: string;
};

export const documents: Document[] = [
  { id: "d1", title: "API Reference v4.pdf", collection: "product-docs", size: "2.4 MB", status: "indexed", updated: "2026-05-22" },
  { id: "d2", title: "Getting Started.md", collection: "product-docs", size: "84 KB", status: "indexed", updated: "2026-05-21" },
  { id: "d3", title: "Q1 Market Report.pdf", collection: "market-intel", size: "5.1 MB", status: "indexed", updated: "2026-05-19" },
  { id: "d4", title: "Engineering Wiki Export", collection: "wiki-acme", size: "12.8 MB", status: "indexing", updated: "2026-05-23" },
  { id: "d5", title: "GDPR Compliance.docx", collection: "legal-corpus", size: "1.2 MB", status: "indexed", updated: "2026-05-15" },
  { id: "d6", title: "Failed import.zip", collection: "onboarding-kit", size: "—", status: "failed", updated: "2026-05-10" },
];

export type ToolCollection = {
  id: string;
  name: string;
  scope: Scope;
  tenant?: string;
  records: number;
  status: Status;
  updated: string;
};

export const toolCollections: ToolCollection[] = [
  { id: "mc1", name: "zendesk-tools", scope: "global", records: 14, status: "active", updated: "2026-05-20" },
  { id: "mc2", name: "salesforce", scope: "global", records: 22, status: "active", updated: "2026-05-18" },
  { id: "mc3", name: "docusign", scope: "tenant", tenant: "Umbrella", records: 8, status: "active", updated: "2026-05-14" },
  { id: "mc4", name: "internal-jira", scope: "tenant", tenant: "Acme Corp", records: 31, status: "draft", updated: "2026-05-22" },
];

export type ToolRecord = {
  id: string;
  name: string;
  collection: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  status: Status;
};

export const toolRecords: ToolRecord[] = [
  { id: "mr1", name: "create_ticket", collection: "zendesk-tools", endpoint: "/api/v2/tickets", method: "POST", status: "active" },
  { id: "mr2", name: "search_tickets", collection: "zendesk-tools", endpoint: "/api/v2/search", method: "GET", status: "active" },
  { id: "mr3", name: "create_opportunity", collection: "salesforce", endpoint: "/services/data/opps", method: "POST", status: "active" },
  { id: "mr4", name: "send_envelope", collection: "docusign", endpoint: "/v2.1/envelopes", method: "POST", status: "active" },
  { id: "mr5", name: "create_issue", collection: "internal-jira", endpoint: "/rest/api/3/issue", method: "POST", status: "draft" },
];
