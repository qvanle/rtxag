export type LlmhubProvider = {
  object: "Provider";
  provider_id: string;
  name: string;
  description: string;
  credentials_schema?: {
    type: string;
    properties?: Record<string, { type: string; description?: string; secret?: boolean }>;
    required?: string[];
  };
  icon_svg_url?: string;
  resources?: Record<string, string>;
  updated_timestamp?: number;
};

export type LlmhubModelSchema = {
  object: "ModelSchema";
  model_schema_id: string;
  name: string;
  description: string;
  deprecated: boolean;
  provider_id: string;
  provider_model_id?: string | null;
  type: "chat_completion" | "text_embedding" | "rerank" | "wildcard";
  properties?: Record<string, unknown> | null;
  config_schemas?: Array<Record<string, unknown>>;
  allowed_configs?: string[];
  pricing?: Record<string, unknown> | null;
};

export type LlmhubChatMessage = {
  role: "system" | "user" | "assistant" | "function";
  content: string;
};

export type LlmhubChatCompletion = {
  object: "ChatCompletion";
  finish_reason: string;
  message: {
    role: "assistant";
    content: string | null;
    function_calls?: Array<{
      id?: string;
      name: string;
      arguments?: Record<string, unknown> | string | null;
    }>;
  };
  created_timestamp: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  fallback_index?: number | null;
  tool_trace?: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
    status_code: number;
    response: string;
    error?: string;
  }>;
};

const LLMHUB_ORIGIN = (import.meta.env.VITE_LLMHUB_ORIGIN as string | undefined) ?? "/api/admin/playground/llmhub";
const LLMHUB_BASE = `${LLMHUB_ORIGIN.replace(/\/+$/, "")}/v1`;

async function llmhubRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${LLMHUB_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.detail?.message ??
      payload?.message ??
      payload?.error?.message ??
      `llmhub request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (payload && typeof payload === "object" && "status" in payload && payload.status === "success" && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

export const llmhubApi = {
  listProviders: () => llmhubRequest<LlmhubProvider[]>("/providers?lang=en"),
  listModelSchemas: (params?: { provider_id?: string; type?: string }) => {
    const search = new URLSearchParams({ lang: "en" });
    if (params?.provider_id) search.set("provider_id", params.provider_id);
    if (params?.type) search.set("type", params.type);
    return llmhubRequest<LlmhubModelSchema[]>(`/model_schemas?${search.toString()}`);
  },
  chatCompletion: (body: {
    model_schema_id: string;
    provider_model_id?: string;
    messages: LlmhubChatMessage[];
    assistant_id?: string;
    stream?: boolean;
    credentials?: Record<string, unknown>;
    encrypted_credentials?: Record<string, unknown>;
    properties?: Record<string, unknown>;
    configs?: Record<string, unknown>;
    fallbacks?: Array<{ model_schema_id: string; provider_model_id?: string }>;
    function_call?: string;
    functions?: Array<Record<string, unknown>>;
  }) =>
    llmhubRequest<LlmhubChatCompletion>("/chat_completion", {
      method: "POST",
      body: JSON.stringify({
        stream: false,
        ...body,
      }),
    }),
};
