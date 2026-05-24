import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ActionButton,
  DataTable,
  GlassCard,
  PageHeader,
  StatusBadge,
} from "@/components/admin/primitives";
import { Plus, KeyRound } from "lucide-react";
import { adminApi, type Provider, useAdminMutation, useAdminQuery } from "@/lib/admin-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/model")({
  component: ModelPage,
});

type ModelFormState = {
  provider_id: string;
  name: string;
  description: string;
  base_url: string;
  api_key: string;
  resources: string;
  icon_svg_url: string;
  updated_timestamp: string;
  enabled: boolean;
};

type ProviderCatalogItem = {
  id: string;
  name: string;
  description: string;
  base_url: string;
};

const EMPTY_FORM: ModelFormState = {
  provider_id: "",
  name: "",
  description: "",
  base_url: "",
  api_key: "",
  resources: "",
  icon_svg_url: "",
  updated_timestamp: "",
  enabled: true,
};

const PROVIDER_CATALOG: ProviderCatalogItem[] = [
  { id: "openai", name: "OpenAI", description: "GPT and embedding models.", base_url: "https://api.openai.com/v1" },
  { id: "anthropic", name: "Anthropic", description: "Claude model family.", base_url: "https://api.anthropic.com/v1" },
  { id: "google_gemini", name: "Google Gemini", description: "Gemini models by Google.", base_url: "https://generativelanguage.googleapis.com/v1beta" },
  { id: "azure_openai", name: "Azure OpenAI", description: "OpenAI models via Azure.", base_url: "https://{resource-name}.openai.azure.com/openai/v1" },
  { id: "aws_bedrock", name: "AWS Bedrock", description: "Foundation models on AWS.", base_url: "https://bedrock-runtime.{region}.amazonaws.com" },
  { id: "cohere", name: "Cohere", description: "Text generation and embeddings.", base_url: "https://api.cohere.com/v1" },
  { id: "mistralai", name: "Mistral AI", description: "Mistral and Mixtral models.", base_url: "https://api.mistral.ai/v1" },
  { id: "groq", name: "Groq", description: "Low-latency model serving.", base_url: "https://api.groq.com/openai/v1" },
  { id: "togetherai", name: "TogetherAI", description: "Hosted open-weight models.", base_url: "https://api.together.xyz/v1" },
  { id: "ollama", name: "Ollama", description: "Run local models.", base_url: "http://localhost:11434/v1" },
  { id: "ai21", name: "AI21", description: "Language models by AI21 Labs.", base_url: "https://api.ai21.com/studio/v1" },
  { id: "baichuan", name: "Baichuan", description: "Baichuan model provider.", base_url: "https://api.baichuan-ai.com/v1" },
  { id: "hugging_face", name: "Hugging Face", description: "Inference and hosted models.", base_url: "https://api-inference.huggingface.co" },
  { id: "hugging_face_inference_endpoint", name: "HF Inference Endpoint", description: "Dedicated HF endpoints.", base_url: "https://api-inference.huggingface.co" },
  { id: "jina", name: "Jina", description: "Jina AI embedding and retrieval APIs.", base_url: "https://api.jina.ai/v1" },
  { id: "llama_api", name: "Llama API", description: "Hosted Llama-family APIs.", base_url: "https://api.llama-api.com" },
  { id: "lm_studio", name: "LM Studio", description: "Local LM Studio endpoint.", base_url: "http://localhost:1234/v1" },
  { id: "localai", name: "LocalAI", description: "Self-hosted OpenAI-compatible runtime.", base_url: "http://localhost:8080/v1" },
  { id: "minimax", name: "MiniMax", description: "MiniMax model APIs.", base_url: "https://api.minimax.chat/v1" },
  { id: "moonshot", name: "Moonshot", description: "Moonshot AI models.", base_url: "https://api.moonshot.ai/v1" },
  { id: "replicate", name: "Replicate", description: "Model inference platform.", base_url: "https://api.replicate.com/v1" },
  { id: "tongyi", name: "Tongyi", description: "Alibaba Tongyi model family.", base_url: "https://dashscope.aliyuncs.com/api/v1" },
  { id: "wenxin", name: "Wenxin", description: "Baidu Wenxin model family.", base_url: "https://aip.baidubce.com" },
  { id: "yi", name: "Yi", description: "01.AI Yi model family.", base_url: "https://api.lingyiwanwu.com/v1" },
  { id: "zhipu", name: "Zhipu", description: "GLM models by Zhipu AI.", base_url: "https://open.bigmodel.cn/api/paas/v4" },
];

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-foreground/95">
      {children}
      {required && <span className="ml-1 text-destructive">*</span>}
    </label>
  );
}

function fieldClass() {
  return "h-11 w-full rounded-md border border-glass-border bg-transparent px-3 text-sm outline-none transition-shadow focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(120,160,255,0.2)]";
}

function resolveProviderIconURL(providerID: string): string {
  return `https://oapi.tasking.ai/images/providers/icons/${providerID}.svg`;
}

function resolveProviderBaseURL(providerID: string): string {
  return PROVIDER_CATALOG.find((p) => p.id === providerID)?.base_url ?? "";
}

function ModelPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<ModelFormState>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<Provider | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);

  const providersQuery = useAdminQuery(["providers"], adminApi.listProviders);
  const createProvider = useAdminMutation(adminApi.createProvider);
  const updateProvider = useAdminMutation(({ id, body }: { id: string; body: any }) =>
    adminApi.updateProvider(id, body),
  );
  const deleteProvider = useAdminMutation((id: string) => adminApi.deleteProvider(id));

  const providers = providersQuery.data ?? [];
  const knownProviderIDs = useMemo(() => new Set(PROVIDER_CATALOG.map((p) => p.id)), []);

  const isCreateValid = useMemo(
    () => !!form.provider_id.trim() && !!form.name.trim(),
    [form.provider_id, form.name],
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreateStep(1);
    setIsCreateOpen(true);
  };

  const onCreateModel = () => {
    if (!isCreateValid) {
      return;
    }
    const updatedTimestamp = Date.now();
    createProvider.mutate(
      {
        provider_id: form.provider_id.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        base_url: resolveProviderBaseURL(form.provider_id.trim()) || undefined,
        api_key: form.api_key.trim() || undefined,
        icon_svg_url: resolveProviderIconURL(form.provider_id.trim()),
        updated_timestamp: updatedTimestamp,
        enabled: form.enabled,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setCreateStep(1);
          setForm(EMPTY_FORM);
        },
      },
    );
  };

  const onOpenEdit = (p: Provider) => {
    setEditTarget(p);
    setForm({
      provider_id: p.provider_id,
      name: p.name,
      description: p.description ?? "",
      base_url: p.base_url ?? "",
      api_key: "",
      resources: p.resources ?? "",
      icon_svg_url: p.icon_svg_url ?? "",
      updated_timestamp: p.updated_timestamp ? String(p.updated_timestamp) : "",
      enabled: p.enabled,
    });
  };

  const onSubmitEdit = () => {
    if (!editTarget || !isCreateValid) {
      return;
    }
    const updatedTimestamp = Date.now();
    updateProvider.mutate(
      {
        id: editTarget.id,
        body: {
          provider_id: form.provider_id.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
          base_url: resolveProviderBaseURL(form.provider_id.trim()) || undefined,
          api_key: form.api_key.trim() || undefined,
          icon_svg_url: resolveProviderIconURL(form.provider_id.trim()),
          updated_timestamp: updatedTimestamp,
          enabled: form.enabled,
        },
      },
      {
        onSuccess: () => {
          setEditTarget(null);
          setForm(EMPTY_FORM);
        },
      },
    );
  };

  const selectedProviderPreview = providers.find((p) => p.provider_id === form.provider_id) ?? null;
  const selectedCatalogProvider = PROVIDER_CATALOG.find((p) => p.id === form.provider_id) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Models"
        description="Model catalog and connection metadata."
        actions={
          <ActionButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Model
          </ActionButton>
        }
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-glass-border bg-gradient-to-b from-background to-muted/30 max-h-[90vh] overflow-y-auto w-[80vw] max-w-[80vw]">
          <DialogHeader>
            <DialogTitle>Create Model</DialogTitle>
            <DialogDescription>
              {createStep === 1
                ? "Step 1 of 2: Select a provider code for this model."
                : "Step 2 of 2: Enter model metadata and connection settings."}
            </DialogDescription>
          </DialogHeader>

          {createStep === 1 ? (
            <div className="space-y-3">
              <FieldLabel required>Select Provider</FieldLabel>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {PROVIDER_CATALOG.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setForm((v) => ({ ...v, provider_id: p.id }))}
                    className={`rounded-lg border p-3 text-left transition ${form.provider_id === p.id
                      ? "border-primary bg-primary/10"
                      : "border-glass-border bg-background/40 hover:bg-accent/40"
                      }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <img
                        src={resolveProviderIconURL(p.id)}
                        alt=""
                        className="h-4 w-4 shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <span>{p.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{p.id}</div>
                    <div className="mt-2 line-clamp-2 text-xs text-foreground/75">{p.description}</div>
                  </button>
                ))}
              </div>
              <div className="pt-1">
                <FieldLabel>Custom Provider Code (Optional)</FieldLabel>
                <input
                  className={fieldClass()}
                  placeholder="Use only if your provider is not listed above"
                  value={knownProviderIDs.has(form.provider_id) ? "" : form.provider_id}
                  onChange={(e) => setForm((v) => ({ ...v, provider_id: e.target.value.trim() }))}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border border-glass-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
                Selected provider code: <span className="font-medium text-foreground">{form.provider_id}</span>
                {selectedCatalogProvider && <span> ({selectedCatalogProvider.name})</span>}
                {!selectedCatalogProvider && selectedProviderPreview && <span> ({selectedProviderPreview.name})</span>}
              </div>
              <div>
                <FieldLabel required>Model Name</FieldLabel>
                <input className={fieldClass()} placeholder="e.g., GPT-4o" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <input className={fieldClass()} placeholder="Model description" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Base URL (Auto)</FieldLabel>
                <input className={fieldClass()} value={resolveProviderBaseURL(form.provider_id.trim())} readOnly />
              </div>
              <div>
                <FieldLabel>API Key</FieldLabel>
                <input className={fieldClass()} placeholder="sk-..." type="password" value={form.api_key} onChange={(e) => setForm((v) => ({ ...v, api_key: e.target.value }))} />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((v) => ({ ...v, enabled: e.target.checked }))} />
                Enabled
              </label>
            </div>
          )}

          <DialogFooter className="mt-2 border-t border-glass-border/70 pt-4">
            {createStep === 2 && (
              <ActionButton variant="ghost" onClick={() => setCreateStep(1)}>
                Back
              </ActionButton>
            )}
            <ActionButton variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</ActionButton>
            {createStep === 1 ? (
              <ActionButton onClick={() => setCreateStep(2)} disabled={!form.provider_id.trim()}>
                Next
              </ActionButton>
            ) : (
              <ActionButton className="h-11" onClick={onCreateModel} disabled={createProvider.isPending || !isCreateValid}>
                Create Model
              </ActionButton>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="glass border-glass-border bg-gradient-to-b from-background to-muted/30 max-h-[90vh] overflow-y-auto w-[80vw] max-w-[80vw]">
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>Update model metadata and API key. Leave API key empty to keep current value.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <FieldLabel required>Select Provider</FieldLabel>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PROVIDER_CATALOG.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setForm((v) => ({ ...v, provider_id: p.id }))}
                    className={`rounded-md border p-2 text-left transition ${form.provider_id === p.id
                      ? "border-primary bg-primary/10"
                      : "border-glass-border bg-background/40 hover:bg-accent/40"
                      }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <img
                        src={resolveProviderIconURL(p.id)}
                        alt=""
                        className="h-4 w-4 shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <span>{p.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{p.id}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Custom Provider Code (Optional)</FieldLabel>
              <input
                className={fieldClass()}
                placeholder="Use only if not listed"
                value={knownProviderIDs.has(form.provider_id) ? "" : form.provider_id}
                onChange={(e) => setForm((v) => ({ ...v, provider_id: e.target.value.trim() }))}
              />
            </div>
            <div>
              <FieldLabel required>Model Name</FieldLabel>
              <input className={fieldClass()} value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <input className={fieldClass()} value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>Base URL (Auto)</FieldLabel>
              <input className={fieldClass()} value={resolveProviderBaseURL(form.provider_id.trim())} readOnly />
            </div>
            <div>
              <FieldLabel>API Key</FieldLabel>
              <input className={fieldClass()} type="password" placeholder="Leave empty to keep current" value={form.api_key} onChange={(e) => setForm((v) => ({ ...v, api_key: e.target.value }))} />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((v) => ({ ...v, enabled: e.target.checked }))} />
              Enabled
            </label>
          </div>
          <DialogFooter className="mt-2 border-t border-glass-border/70 pt-4">
            <ActionButton variant="ghost" onClick={() => setEditTarget(null)}>Cancel</ActionButton>
            <ActionButton onClick={onSubmitEdit} disabled={updateProvider.isPending || !isCreateValid}>Save</ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="glass border-glass-border bg-gradient-to-b from-background to-muted/30 w-[80vw] max-w-[80vw]">
          <DialogHeader>
            <DialogTitle>Delete Model</DialogTitle>
            <DialogDescription>
              Delete <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <ActionButton variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</ActionButton>
            <ActionButton
              onClick={() => {
                if (!deleteTarget) return;
                deleteProvider.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
                });
              }}
              disabled={deleteProvider.isPending}
            >
              Delete
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GlassCard className="overflow-hidden p-0">
        <DataTable
          columns={["Model", "Code", "Base URL", "Status", "Actions"]}
          rows={providers.map((p) => [
            <div key="n" className="flex items-center gap-2 font-medium">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-primary">
                <img
                  src={resolveProviderIconURL(p.provider_id)}
                  alt=""
                  className="h-4 w-4 shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              {p.name}
            </div>,
            <span key="c" className="text-foreground/80">{p.provider_id}</span>,
            <span key="b" className="text-muted-foreground">{p.base_url ?? "-"}</span>,
            <StatusBadge key="s" status={p.enabled ? "enabled" : "disabled"} />,
            <div key="a" className="flex gap-2">
              <ActionButton variant="ghost" className="text-xs" onClick={() => onOpenEdit(p)}>
                Edit
              </ActionButton>
              <ActionButton variant="ghost" className="text-xs" onClick={() => setDeleteTarget(p)}>
                Delete
              </ActionButton>
            </div>,
          ])}
        />
      </GlassCard>
    </div>
  );
}
