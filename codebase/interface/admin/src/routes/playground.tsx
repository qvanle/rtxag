import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bot, Database, Menu, Play, RefreshCcw, Send, Sparkles, Plug, Settings2 } from "lucide-react";
import { ActionButton, GlassCard, PageHeader, StatusBadge } from "@/components/admin/primitives";
import { cn } from "@/lib/utils";
import { adminApi, type Assistant, type Provider, useAdminQuery } from "@/lib/admin-api";
import { llmhubApi, type LlmhubModelSchema } from "@/lib/llmhub-api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/playground")({
  component: PlaygroundPage,
});

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type AssistantOption = Assistant & {
  tenant_label: string;
};

type TargetMode = "agent" | "model";

function PlaygroundPage() {
  const assistantsQuery = useAdminQuery(["playground", "assistants"], async () => {
    const globalAssistants = await adminApi.listAssistants("global");
    const tenants = await adminApi.listTenants();
    const tenantAssistants = await Promise.all(
      tenants.map(async (tenant) => {
        const assistants = await adminApi.listAssistantsByTenant(tenant.id_internal);
        return assistants.map((assistant) => ({ ...assistant, tenant_label: tenant.name }));
      }),
    );
    return [
      ...globalAssistants.map((assistant) => ({ ...assistant, tenant_label: "Global" })),
      ...tenantAssistants.flat(),
    ] as AssistantOption[];
  });
  const providersQuery = useAdminQuery(["playground", "providers"], adminApi.listProviders);

  const assistants = assistantsQuery.data ?? [];
  const providers = providersQuery.data ?? [];

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState<TargetMode>("agent");
  const [selectedAssistantId, setSelectedAssistantId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");
  const [modelSchemas, setModelSchemas] = useState<LlmhubModelSchema[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [responseMeta, setResponseMeta] = useState<{ finish_reason?: string; input_tokens?: number; output_tokens?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedAssistant = useMemo(
    () => assistants.find((assistant) => assistant.id === selectedAssistantId) ?? null,
    [assistants, selectedAssistantId],
  );
  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.provider_id === selectedProviderId) ?? null,
    [providers, selectedProviderId],
  );
  const activeProviderId = mode === "agent" ? selectedAssistant?.provider_id ?? "" : selectedProviderId;
  const activeProvider = useMemo(
    () => providers.find((provider) => provider.provider_id === activeProviderId) ?? null,
    [providers, activeProviderId],
  );
  const activeSchema = useMemo(
    () => modelSchemas.find((schema) => schema.model_schema_id === selectedSchemaId) ?? null,
    [modelSchemas, selectedSchemaId],
  );
  const activeTitle = mode === "agent" ? selectedAssistant?.name : selectedProvider?.name;
  const activeSubtitle =
    mode === "agent"
      ? selectedAssistant
        ? `${selectedAssistant.tenant_label} · ${selectedAssistant.provider_id}`
        : "Select an agent"
      : selectedProvider
        ? selectedProvider.provider_id
        : "Select a model";

  useEffect(() => {
    if (!selectedAssistantId && assistants[0]) {
      setSelectedAssistantId(assistants[0].id);
    }
  }, [assistants, selectedAssistantId]);

  useEffect(() => {
    if (!selectedProviderId && providers[0]) {
      setSelectedProviderId(providers[0].provider_id);
    }
  }, [providers, selectedProviderId]);

  useEffect(() => {
    if (mode === "agent" && selectedAssistant?.provider_id && selectedAssistant.provider_id !== selectedProviderId) {
      setSelectedProviderId(selectedAssistant.provider_id);
    }
  }, [mode, selectedAssistant?.provider_id, selectedAssistantId, selectedProviderId]);

  useEffect(() => {
    let cancelled = false;
    if (!activeProviderId) {
      setModelSchemas([]);
      setSelectedSchemaId("");
      return;
    }

    (async () => {
      try {
        const data = await llmhubApi.listModelSchemas({ provider_id: activeProviderId, type: "chat_completion" });
        if (cancelled) return;
        const filtered = data.filter((schema) => schema.type === "chat_completion" || schema.type === "wildcard");
        setModelSchemas(filtered);
        setSelectedSchemaId((current) => {
          if (current && filtered.some((schema) => schema.model_schema_id === current)) return current;
          return filtered[0]?.model_schema_id ?? "";
        });
        if (!filtered.length) {
          setError(`No chat_completion schemas found for ${activeProviderId}`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load model schemas");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeProviderId]);

  const resetConversation = () => {
    setMessages([]);
    setResponseMeta(null);
    setDraft("");
    setError("");
  };

  const runInference = async () => {
    const prompt = draft.trim();
    if (!prompt || !activeProviderId || !selectedSchemaId || (mode === "agent" && !selectedAssistant) || (mode === "model" && !selectedProvider)) {
      return;
    }

    setError("");
    setLoading(true);

    const requestMessages: ChatMessage[] = [
      ...(systemPrompt.trim() ? [{ role: "system" as const, content: systemPrompt.trim() }] : []),
      ...messages,
      { role: "user", content: prompt },
    ];

    try {
      const result = await llmhubApi.chatCompletion({
        model_schema_id: selectedSchemaId,
        provider_model_id: activeSchema?.provider_model_id ?? undefined,
        messages: requestMessages,
      });
      const assistantText = result.message.content ?? "";
      setMessages((current) => [
        ...current,
        { role: "user", content: prompt },
        { role: "assistant", content: assistantText || "[No text returned]" },
      ]);
      setResponseMeta({
        finish_reason: result.finish_reason,
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
      });
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inference failed");
    } finally {
      setLoading(false);
    }
  };

  const selectMode = (nextMode: TargetMode) => {
    setMode(nextMode);
    setSettingsOpen(true);
    setError("");
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col gap-4">
      <PageHeader
        title="Playground"
        description="Chat with a saved Agent or Model through llmhub."
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionButton variant="outline" onClick={resetConversation}>
              <RefreshCcw className="h-4 w-4" /> Reset
            </ActionButton>
            <ActionButton variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="h-4 w-4" /> Settings
            </ActionButton>
          </div>
        }
      />

      {error && <div className="text-sm text-destructive">{error}</div>}

      <GlassCard className="flex min-h-[72vh] flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b border-glass-border px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold leading-tight">Chat</div>
                <div className="truncate text-xs text-muted-foreground">
                  {activeTitle ? `${activeTitle} · ${activeSubtitle}` : "Open settings to choose an Agent or Model"}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={mode === "agent" ? "active" : "draft"} />
            <ActionButton variant="outline" onClick={() => setSettingsOpen(true)}>
              <Menu className="h-4 w-4" /> Settings
            </ActionButton>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="grid min-h-[28rem] place-items-center rounded-2xl border border-dashed border-glass-border bg-background/30 p-6 text-center">
              <div className="max-w-md space-y-2">
                <div className="text-lg font-semibold">Start a conversation</div>
                <div className="text-sm text-muted-foreground">
                  Open settings to choose an Agent or Model, then send a prompt.
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-[85%] rounded-2xl border px-4 py-3",
                  message.role === "user"
                    ? "ml-auto border-primary/40 bg-primary/10"
                    : "border-glass-border bg-background/60",
                )}
              >
                <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  {message.role === "assistant" && <Bot className="h-3.5 w-3.5" />}
                  {message.role}
                </div>
                <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-glass-border p-4">
          <div className="rounded-2xl border border-glass-border bg-background/40 p-3">
            <textarea
              className="min-h-28 w-full resize-none rounded-xl border border-glass-border bg-transparent px-4 py-3 text-sm outline-none transition-shadow focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(120,160,255,0.2)]"
              placeholder="Ask something..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void runInference();
                }
              }}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {activeTitle && activeSchema
                  ? `Testing ${activeTitle} with ${activeSchema.name}`
                  : "Select an Agent or Model in Settings"}
              </div>
              <ActionButton onClick={runInference} disabled={loading || !draft.trim() || !activeProviderId || !selectedSchemaId}>
                <Send className="h-4 w-4" /> {loading ? "Running..." : "Send"}
              </ActionButton>
            </div>
          </div>
        </div>
      </GlassCard>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Choose one target type and provide the system prompt.</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Target</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => selectMode("agent")}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-all",
                    mode === "agent"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-glass-border bg-background/50 text-muted-foreground",
                  )}
                >
                  <div className="font-medium">Agent</div>
                  <div className="text-xs text-muted-foreground">Use a saved assistant record.</div>
                </button>
                <button
                  type="button"
                  onClick={() => selectMode("model")}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-all",
                    mode === "model"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-glass-border bg-background/50 text-muted-foreground",
                  )}
                >
                  <div className="font-medium">Model</div>
                  <div className="text-xs text-muted-foreground">Use a saved provider record.</div>
                </button>
              </div>
            </div>

            {mode === "agent" ? (
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Select Agent</div>
                <select
                  className="h-10 w-full rounded-md border border-glass-border bg-background px-3 text-sm"
                  value={selectedAssistantId}
                  onChange={(e) => setSelectedAssistantId(e.target.value)}
                >
                  <option value="">Select agent</option>
                  {assistants.map((assistant) => (
                    <option key={assistant.id} value={assistant.id}>
                      {assistant.name} ({assistant.tenant_label})
                    </option>
                  ))}
                </select>
                {selectedAssistant && (
                  <div className="rounded-xl border border-glass-border bg-background/40 p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">{selectedAssistant.name}</div>
                        <div className="text-sm text-muted-foreground">{selectedAssistant.tenant_label}</div>
                        <div className="mt-2 text-xs text-muted-foreground break-all">
                          Provider: {selectedAssistant.provider_id}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <StatusBadge status={selectedAssistant.status} />
                      <span className="inline-flex items-center gap-1 rounded-md border border-glass-border bg-muted/40 px-2 py-0.5 text-[11px] text-foreground/80">
                        <Database className="h-3 w-3" />
                        {selectedAssistant.retrieval_collection_ids.length} retrieval
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-glass-border bg-muted/40 px-2 py-0.5 text-[11px] text-foreground/80">
                        <Plug className="h-3 w-3" />
                        {selectedAssistant.mcp_collection_ids.length} mcp
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Select Model</div>
                <select
                  className="h-10 w-full rounded-md border border-glass-border bg-background px-3 text-sm"
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                >
                  <option value="">Select model</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.provider_id}>
                      {provider.name} ({provider.provider_id})
                    </option>
                  ))}
                </select>
                {selectedProvider && (
                  <div className="rounded-xl border border-glass-border bg-background/40 p-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={selectedProvider.icon_svg_url}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg bg-background/60 p-2"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold">{selectedProvider.name}</div>
                        <div className="text-sm text-muted-foreground">{selectedProvider.description}</div>
                        <div className="mt-2 text-xs text-muted-foreground break-all">
                          {selectedProvider.provider_id}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">System prompt</div>
              <textarea
                className="min-h-32 w-full rounded-xl border border-glass-border bg-transparent px-3 py-2 text-sm outline-none transition-shadow focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(120,160,255,0.2)]"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>

            <div className="rounded-xl border border-glass-border bg-background/40 p-4 text-xs text-muted-foreground">
              llmhub schema is resolved automatically from the selected {mode === "agent" ? "agent provider" : "model provider"}.
              {activeSchema ? (
                <span className="ml-1 text-foreground">Current schema: {activeSchema.name}</span>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
