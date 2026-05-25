package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"rotexai/core/api/internal/http/response"
)

type llmhubProvider struct {
	Object            string `json:"object"`
	ProviderID        string `json:"provider_id"`
	CredentialsSchema struct {
		Properties map[string]struct {
			Type        string `json:"type"`
			Description string `json:"description,omitempty"`
			Secret      bool   `json:"secret,omitempty"`
		} `json:"properties"`
		Required []string `json:"required"`
	} `json:"credentials_schema"`
}

type llmhubModelSchema struct {
	Object     string `json:"object"`
	SchemaID   string `json:"model_schema_id"`
	ProviderID string `json:"provider_id"`
}

func (h *Handler) proxyLlmhub(w http.ResponseWriter, r *http.Request, targetPath string) {
	origin := strings.TrimRight(h.deps.LLMHubOrigin, "/")
	if origin == "" {
		response.Error(w, 500, "llmhub_origin_missing", "LLMHub origin is not configured", nil)
		return
	}

	baseURL, err := url.Parse(origin)
	if err != nil {
		response.Error(w, 500, "llmhub_origin_invalid", err.Error(), nil)
		return
	}

	reqURL := *baseURL
	reqURL.Path = strings.TrimRight(baseURL.Path, "/") + targetPath
	reqURL.RawQuery = r.URL.RawQuery

	req, err := http.NewRequestWithContext(r.Context(), r.Method, reqURL.String(), r.Body)
	if err != nil {
		response.Error(w, 500, "llmhub_proxy_request_failed", err.Error(), nil)
		return
	}
	req.Header = r.Header.Clone()
	req.Host = baseURL.Host

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		response.Error(w, 502, "llmhub_unavailable", err.Error(), nil)
		return
	}
	defer resp.Body.Close()

	for key, values := range resp.Header {
		if strings.EqualFold(key, "Content-Length") || strings.EqualFold(key, "Transfer-Encoding") {
			continue
		}
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

func (h *Handler) llmhubJSON(r *http.Request, targetPath string, out any) error {
	origin := strings.TrimRight(h.deps.LLMHubOrigin, "/")
	if origin == "" {
		return fmt.Errorf("LLMHub origin is not configured")
	}

	baseURL, err := url.Parse(origin)
	if err != nil {
		return err
	}

	parsedTarget, err := url.Parse(targetPath)
	if err != nil {
		return err
	}

	reqURL := *baseURL
	reqURL.Path = strings.TrimRight(baseURL.Path, "/") + parsedTarget.Path
	reqURL.RawQuery = parsedTarget.RawQuery

	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, reqURL.String(), nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("llmhub request failed: %s", strings.TrimSpace(string(body)))
	}

	var envelope struct {
		Status string          `json:"status"`
		Data   json.RawMessage `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return err
	}
	if strings.TrimSpace(envelope.Status) != "" && envelope.Status != "success" {
		return fmt.Errorf("llmhub returned status %s", envelope.Status)
	}
	if out == nil {
		return nil
	}
	return json.Unmarshal(envelope.Data, out)
}

func (h *Handler) attachProviderCredentials(r *http.Request, payload map[string]any) error {
	modelSchemaID, _ := payload["model_schema_id"].(string)
	if strings.TrimSpace(modelSchemaID) == "" {
		return fmt.Errorf("model_schema_id is required")
	}

	var modelSchemas []llmhubModelSchema
	if err := h.llmhubJSON(r, "/v1/model_schemas?lang=en", &modelSchemas); err != nil {
		return err
	}

	var modelSchema *llmhubModelSchema
	for i := range modelSchemas {
		if modelSchemas[i].SchemaID == modelSchemaID {
			modelSchema = &modelSchemas[i]
			break
		}
	}
	if modelSchema == nil {
		return fmt.Errorf("model schema %s not found", modelSchemaID)
	}

	var providers []llmhubProvider
	if err := h.llmhubJSON(r, "/v1/providers?lang=en", &providers); err != nil {
		return err
	}

	var provider *llmhubProvider
	for i := range providers {
		if providers[i].ProviderID == modelSchema.ProviderID {
			provider = &providers[i]
			break
		}
	}
	if provider == nil {
		return fmt.Errorf("provider %s not found", modelSchema.ProviderID)
	}

	storedProvider, err := h.deps.Provider.GetByProviderID(r.Context(), modelSchema.ProviderID)
	if err != nil {
		return err
	}
	if strings.TrimSpace(storedProvider.APIKey) == "" {
		return fmt.Errorf("provider %s API key is not set", modelSchema.ProviderID)
	}

	credentials := map[string]any{}
	required := provider.CredentialsSchema.Required
	switch len(required) {
	case 0:
		credentials[strings.ToUpper(modelSchema.ProviderID)+"_API_KEY"] = storedProvider.APIKey
	case 1:
		credentials[required[0]] = storedProvider.APIKey
	default:
		for _, field := range required {
			upper := strings.ToUpper(field)
			if strings.Contains(upper, "API_KEY") || strings.Contains(upper, "API_TOKEN") || strings.Contains(upper, "TOKEN") {
				credentials[field] = storedProvider.APIKey
			}
		}
	}

	if len(credentials) == 0 {
		credentials[strings.ToUpper(modelSchema.ProviderID)+"_API_KEY"] = storedProvider.APIKey
	}

	if existing, ok := payload["credentials"].(map[string]any); ok {
		for k, v := range existing {
			credentials[k] = v
		}
	}
	payload["credentials"] = credentials
	delete(payload, "encrypted_credentials")
	return nil
}

func (h *Handler) PlaygroundListProviders(w http.ResponseWriter, r *http.Request) {
	h.proxyLlmhub(w, r, "/v1/providers")
}

func (h *Handler) PlaygroundListModelSchemas(w http.ResponseWriter, r *http.Request) {
	h.proxyLlmhub(w, r, "/v1/model_schemas")
}

func (h *Handler) PlaygroundChatCompletion(w http.ResponseWriter, r *http.Request) {
	var payload map[string]any
	if !decodeJSON(w, r, &payload) {
		return
	}

	if err := h.attachProviderCredentials(r, payload); err != nil {
		response.Error(w, 422, "attach_provider_credentials_failed", err.Error(), nil)
		return
	}

	assistantID, _ := payload["assistant_id"].(string)
	delete(payload, "assistant_id")
	if strings.TrimSpace(assistantID) != "" {
		body, err := h.runToolChatCompletion(r, payload, assistantID)
		if err != nil {
			response.Error(w, 422, "tool_chat_completion_failed", err.Error(), nil)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(body)
		return
	}

	status, body, headers, err := h.postLlmhubJSON(r.Context(), r.Header, "/v1/chat_completion", payload)
	if err != nil {
		response.Error(w, 502, "llmhub_proxy_request_failed", err.Error(), nil)
		return
	}
	for key, values := range headers {
		if strings.EqualFold(key, "Content-Length") || strings.EqualFold(key, "Transfer-Encoding") {
			continue
		}
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.WriteHeader(status)
	_, _ = w.Write(body)
}
