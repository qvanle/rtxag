package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
)

type llmhubEnvelope struct {
	Status string          `json:"status"`
	Data   json.RawMessage `json:"data"`
}

type llmhubChatCompletionResponse struct {
	Object           string                      `json:"object"`
	FinishReason     string                      `json:"finish_reason"`
	Message          llmhubChatCompletionMessage `json:"message"`
	CreatedTimestamp int64                       `json:"created_timestamp"`
	Usage            llmhubChatCompletionUsage   `json:"usage"`
	FallbackIndex    *int                        `json:"fallback_index,omitempty"`
	ToolTrace        []toolTraceItem             `json:"tool_trace,omitempty"`
}

type llmhubChatCompletionMessage struct {
	Role          string               `json:"role"`
	Content       *string              `json:"content,omitempty"`
	FunctionCalls []llmhubFunctionCall `json:"function_calls,omitempty"`
}

type llmhubFunctionCall struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	Arguments json.RawMessage `json:"arguments"`
}

type llmhubChatCompletionUsage struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
}

type llmhubFunction struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Parameters  map[string]any `json:"parameters"`
}

type toolDescriptor struct {
	Description string            `json:"description,omitempty"`
	Method      string            `json:"method"`
	URL         string            `json:"url"`
	Headers     map[string]string `json:"headers,omitempty"`
	Parameters  map[string]any    `json:"parameters,omitempty"`
	TimeoutMS   int               `json:"timeout_ms,omitempty"`
}

type toolTraceItem struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Method     string `json:"method"`
	URL        string `json:"url"`
	StatusCode int    `json:"status_code"`
	Response   string `json:"response"`
	Error      string `json:"error,omitempty"`
}

type toolSandboxEnvelope struct {
	Status string          `json:"status"`
	Data   json.RawMessage `json:"data"`
}

type toolSandboxExecuteRequest struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Method    string            `json:"method"`
	URL       string            `json:"url"`
	Headers   map[string]string `json:"headers,omitempty"`
	Arguments map[string]any    `json:"arguments,omitempty"`
	TimeoutMS int               `json:"timeout_ms,omitempty"`
}

func (h *Handler) postLlmhubJSON(ctx context.Context, headers http.Header, targetPath string, payload any) (int, []byte, http.Header, error) {
	origin := strings.TrimRight(h.deps.LLMHubOrigin, "/")
	if origin == "" {
		return 0, nil, nil, fmt.Errorf("LLMHub origin is not configured")
	}

	baseURL, err := url.Parse(origin)
	if err != nil {
		return 0, nil, nil, err
	}

	reqURL := *baseURL
	reqURL.Path = strings.TrimRight(baseURL.Path, "/") + targetPath

	body, err := json.Marshal(payload)
	if err != nil {
		return 0, nil, nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL.String(), bytes.NewReader(body))
	if err != nil {
		return 0, nil, nil, err
	}
	req.Header = http.Header{}
	if headers != nil {
		req.Header = headers.Clone()
	}
	req.Header.Set("content-type", "application/json")
	req.Host = baseURL.Host

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return 0, nil, nil, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, nil, nil, err
	}

	return resp.StatusCode, raw, resp.Header.Clone(), nil
}

func (h *Handler) postToolsSandboxJSON(ctx context.Context, headers http.Header, payload any) (int, []byte, http.Header, error) {
	origin := strings.TrimRight(h.deps.ToolsOrigin, "/")
	if origin == "" {
		return 0, nil, nil, fmt.Errorf("tools sandbox origin is not configured")
	}

	baseURL, err := url.Parse(origin)
	if err != nil {
		return 0, nil, nil, err
	}

	reqURL := *baseURL
	reqURL.Path = strings.TrimRight(baseURL.Path, "/") + "/v1/execute"

	body, err := json.Marshal(payload)
	if err != nil {
		return 0, nil, nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL.String(), bytes.NewReader(body))
	if err != nil {
		return 0, nil, nil, err
	}
	req.Header = http.Header{}
	if headers != nil {
		req.Header = headers.Clone()
	}
	req.Header.Set("content-type", "application/json")
	req.Host = baseURL.Host

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return 0, nil, nil, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, nil, nil, err
	}

	return resp.StatusCode, raw, resp.Header.Clone(), nil
}

func (h *Handler) runToolChatCompletion(r *http.Request, payload map[string]any, assistantID string) ([]byte, error) {
	functions, toolLookup, err := h.toolFunctionsForAssistant(r.Context(), assistantID)
	if err != nil {
		return nil, err
	}

	delete(payload, "assistant_id")

	if len(functions) == 0 {
		status, raw, _, err := h.postLlmhubJSON(r.Context(), r.Header, "/v1/chat_completion", payload)
		if err != nil {
			return nil, err
		}
		if status >= http.StatusBadRequest {
			return nil, fmt.Errorf(strings.TrimSpace(string(raw)))
		}
		return raw, nil
	}

	messages, err := decodeMessages(payload["messages"])
	if err != nil {
		return nil, err
	}

	payload["functions"] = functions
	payload["function_call"] = "auto"
	payload["messages"] = messages

	trace := make([]toolTraceItem, 0, 8)
	const maxIterations = 8

	for i := 0; i < maxIterations; i++ {
		status, raw, _, err := h.postLlmhubJSON(r.Context(), r.Header, "/v1/chat_completion", payload)
		if err != nil {
			return nil, err
		}
		if status >= http.StatusBadRequest {
			return nil, fmt.Errorf(strings.TrimSpace(string(raw)))
		}

		var envelope llmhubEnvelope
		if err := json.Unmarshal(raw, &envelope); err != nil {
			return nil, err
		}
		if strings.TrimSpace(envelope.Status) != "success" {
			return nil, fmt.Errorf("llmhub returned status %s", envelope.Status)
		}

		var completion llmhubChatCompletionResponse
		if err := json.Unmarshal(envelope.Data, &completion); err != nil {
			return nil, err
		}

		if completion.FinishReason != "function_calls" || len(completion.Message.FunctionCalls) == 0 {
			completion.ToolTrace = trace
			finalEnvelope, err := json.Marshal(llmhubEnvelope{Status: "success", Data: mustJSONRaw(completion)})
			if err != nil {
				return nil, err
			}
			return finalEnvelope, nil
		}

		assistantCallMessage := map[string]any{
			"role":           "assistant",
			"function_calls": completion.Message.FunctionCalls,
		}
		messages = append(messages, assistantCallMessage)

		for _, functionCall := range completion.Message.FunctionCalls {
			toolName := strings.TrimSpace(functionCall.Name)
			spec, ok := toolLookup[toolName]
			if !ok {
				return nil, fmt.Errorf("tool %s not found", toolName)
			}

			result, traceItem, execErr := h.executeToolCall(r.Context(), functionCall, toolName, spec)
			trace = append(trace, traceItem)
			if execErr != nil {
				return nil, execErr
			}

			messages = append(messages, map[string]any{
				"role":    "function",
				"id":      functionCall.ID,
				"content": result,
			})
		}

		payload["messages"] = messages
	}

	return nil, fmt.Errorf("tool loop exceeded %d iterations", maxIterations)
}

func (h *Handler) toolFunctionsForAssistant(ctx context.Context, assistantID string) ([]llmhubFunction, map[string]toolDescriptor, error) {
	assistant, err := h.deps.Assistant.Get(ctx, assistantID)
	if err != nil {
		return nil, nil, err
	}

	toolFunctions := make([]llmhubFunction, 0)
	toolLookup := make(map[string]toolDescriptor)
	for _, collectionID := range assistant.ToolCollectionIDs {
		records, err := h.deps.Tools.ListRecords(ctx, collectionID)
		if err != nil {
			return nil, nil, err
		}
		sort.SliceStable(records, func(i, j int) bool {
			return records[i].Key < records[j].Key
		})
		for _, record := range records {
			key := strings.TrimSpace(record.Key)
			if key == "" {
				return nil, nil, fmt.Errorf("tool collection %s has a record with an empty key", collectionID)
			}
			if _, exists := toolLookup[key]; exists {
				return nil, nil, fmt.Errorf("duplicate tool name %s", key)
			}
			spec, err := parseToolDescriptor(record.Value)
			if err != nil {
				return nil, nil, fmt.Errorf("tool %s: %w", key, err)
			}
			if strings.TrimSpace(spec.Method) == "" {
				spec.Method = http.MethodGet
			}
			if strings.TrimSpace(spec.URL) == "" {
				return nil, nil, fmt.Errorf("tool %s is missing url", key)
			}
			if len(spec.Parameters) == 0 {
				spec.Parameters = map[string]any{
					"type":       "object",
					"properties": map[string]any{},
					"required":   []string{},
				}
			}
			toolFunctions = append(toolFunctions, llmhubFunction{
				Name:        key,
				Description: spec.Description,
				Parameters:  spec.Parameters,
			})
			toolLookup[key] = spec
		}
	}

	return toolFunctions, toolLookup, nil
}

func parseToolDescriptor(raw string) (toolDescriptor, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return toolDescriptor{}, fmt.Errorf("descriptor is empty")
	}

	var spec toolDescriptor
	if err := json.Unmarshal([]byte(raw), &spec); err != nil {
		return toolDescriptor{}, err
	}
	spec.Method = strings.ToUpper(strings.TrimSpace(spec.Method))
	spec.URL = strings.TrimSpace(spec.URL)
	return spec, nil
}

func validateToolDescriptorJSON(raw string) error {
	spec, err := parseToolDescriptor(raw)
	if err != nil {
		return err
	}
	if strings.TrimSpace(spec.URL) == "" {
		return fmt.Errorf("url is required")
	}
	return nil
}

func decodeMessages(raw any) ([]map[string]any, error) {
	b, err := json.Marshal(raw)
	if err != nil {
		return nil, err
	}
	var messages []map[string]any
	if err := json.Unmarshal(b, &messages); err != nil {
		return nil, err
	}
	return messages, nil
}

func (h *Handler) executeToolCall(ctx context.Context, call llmhubFunctionCall, name string, spec toolDescriptor) (string, toolTraceItem, error) {
	args := map[string]any{}
	if len(call.Arguments) > 0 {
		if err := json.Unmarshal(call.Arguments, &args); err != nil {
			trace := toolTraceItem{ID: call.ID, Name: name, Method: spec.Method, URL: spec.URL, Error: fmt.Sprintf("invalid arguments: %v", err)}
			result, _ := json.Marshal(trace)
			return string(result), trace, nil
		}
	}

	sandboxReq := toolSandboxExecuteRequest{
		ID:        call.ID,
		Name:      name,
		Method:    spec.Method,
		URL:       spec.URL,
		Headers:   spec.Headers,
		Arguments: args,
		TimeoutMS: spec.TimeoutMS,
	}

	status, raw, _, err := h.postToolsSandboxJSON(ctx, http.Header{}, sandboxReq)
	if err != nil {
		trace := toolTraceItem{ID: call.ID, Name: name, Method: spec.Method, URL: spec.URL, Error: err.Error()}
		result, _ := json.Marshal(trace)
		return string(result), trace, nil
	}
	if status >= http.StatusBadRequest {
		trace := toolTraceItem{ID: call.ID, Name: name, Method: spec.Method, URL: spec.URL, Error: strings.TrimSpace(string(raw))}
		result, _ := json.Marshal(trace)
		return string(result), trace, nil
	}

	var envelope toolSandboxEnvelope
	if err := json.Unmarshal(raw, &envelope); err != nil {
		trace := toolTraceItem{ID: call.ID, Name: name, Method: spec.Method, URL: spec.URL, Error: err.Error()}
		result, _ := json.Marshal(trace)
		return string(result), trace, nil
	}
	if strings.TrimSpace(envelope.Status) != "success" {
		trace := toolTraceItem{ID: call.ID, Name: name, Method: spec.Method, URL: spec.URL, Error: fmt.Sprintf("sandbox returned status %s", envelope.Status)}
		result, _ := json.Marshal(trace)
		return string(result), trace, nil
	}

	var trace toolTraceItem
	if err := json.Unmarshal(envelope.Data, &trace); err != nil {
		trace := toolTraceItem{ID: call.ID, Name: name, Method: spec.Method, URL: spec.URL, Error: err.Error()}
		result, _ := json.Marshal(trace)
		return string(result), trace, nil
	}
	result, _ := json.Marshal(trace)
	return string(result), trace, nil
}

func mustJSONRaw(v any) json.RawMessage {
	raw, err := json.Marshal(v)
	if err != nil {
		return json.RawMessage(`null`)
	}
	return raw
}
