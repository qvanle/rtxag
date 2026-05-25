package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"rotexai/core/api/internal/application"
	"rotexai/core/api/internal/domain"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}

func jsonResponse(status int, body string) *http.Response {
	return &http.Response{
		StatusCode: status,
		Header:     http.Header{"Content-Type": []string{"application/json"}},
		Body:       io.NopCloser(strings.NewReader(body)),
	}
}

func TestPlaygroundChatCompletionWithToolExecution(t *testing.T) {
	var chatCalls int32
	originalClient := http.DefaultClient
	http.DefaultClient = &http.Client{
		Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
			switch {
			case r.Method == http.MethodGet && r.URL.Host == "llmhub.local" && strings.HasPrefix(r.URL.Path, "/v1/model_schemas"):
				return jsonResponse(http.StatusOK, `{"status":"success","data":[{"object":"ModelSchema","model_schema_id":"schema-1","name":"Schema 1","description":"Test schema","deprecated":false,"provider_id":"openai","type":"chat_completion"}]}`), nil
			case r.Method == http.MethodGet && r.URL.Host == "llmhub.local" && strings.HasPrefix(r.URL.Path, "/v1/providers"):
				return jsonResponse(http.StatusOK, `{"status":"success","data":[{"object":"Provider","provider_id":"openai","credentials_schema":{"properties":{},"required":[]}}]}`), nil
			case r.Method == http.MethodPost && r.URL.Host == "llmhub.local" && strings.HasPrefix(r.URL.Path, "/v1/chat_completion"):
				call := atomic.AddInt32(&chatCalls, 1)
				if call == 1 {
					return jsonResponse(http.StatusOK, `{"status":"success","data":{"object":"ChatCompletion","finish_reason":"function_calls","message":{"role":"assistant","content":null,"function_calls":[{"id":"call-1","name":"hello_tool","arguments":{"name":"world"}}]},"created_timestamp":1710000000,"usage":{"input_tokens":3,"output_tokens":2}}}`), nil
				}
				return jsonResponse(http.StatusOK, `{"status":"success","data":{"object":"ChatCompletion","finish_reason":"stop","message":{"role":"assistant","content":"done"},"created_timestamp":1710000001,"usage":{"input_tokens":8,"output_tokens":4}}}`), nil
			case r.Method == http.MethodPost && r.URL.Host == "tools.local" && r.URL.Path == "/v1/execute":
				return jsonResponse(http.StatusOK, `{"status":"success","data":{"id":"call-1","name":"hello_tool","method":"POST","url":"http://tool.local/hello","status_code":200,"response":"{\"ok\":true,\"echo\":\"tool-called\"}"}}`), nil
			default:
				return jsonResponse(http.StatusNotFound, `{"error":"not found"}`), nil
			}
		}),
	}
	defer func() {
		http.DefaultClient = originalClient
	}()

	services := application.NewInMemoryServices()
	provider, err := services.Provider.Create(nil, application.CreateProviderRequest{
		ProviderID:  "openai",
		Name:        "OpenAI",
		Description: "Test provider",
		BaseURL:     "https://example.com",
		APIKey:      "sk-test",
		Enabled:     true,
	})
	if err != nil {
		t.Fatalf("create provider: %v", err)
	}
	toolCollection, err := services.Tools.CreateCollection(nil, application.CreateToolCollectionRequest{
		Scope: domain.ScopeGlobal,
		Name:  "tools",
	})
	if err != nil {
		t.Fatalf("create tool collection: %v", err)
	}
	if _, err := services.Tools.CreateRecord(nil, toolCollection.ID, application.CreateToolRecordRequest{
		Key:   "hello_tool",
		Value: `{"description":"Greets the tool server","method":"POST","url":"http://tool.local/hello","parameters":{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}}`,
	}); err != nil {
		t.Fatalf("create tool record: %v", err)
	}
	assistant, err := services.Assistant.Create(nil, application.CreateAssistantRequest{
		Scope:             domain.ScopeGlobal,
		Name:              "agent",
		ProviderID:        provider.ProviderID,
		ToolCollectionIDs: []string{toolCollection.ID},
	})
	if err != nil {
		t.Fatalf("create assistant: %v", err)
	}

	handler := New(Deps{
		Provider:     services.Provider,
		Tools:        services.Tools,
		Assistant:    services.Assistant,
		LLMHubOrigin: "http://llmhub.local",
		ToolsOrigin:  "http://tools.local",
	})

	payload := `{
		"model_schema_id":"schema-1",
		"messages":[{"role":"user","content":"say hi"}],
		"assistant_id":"` + assistant.ID + `"
	}`
	req := httptest.NewRequest(http.MethodPost, "/api/admin/playground/chat_completion", strings.NewReader(payload))
	req.Header.Set("content-type", "application/json")
	rr := httptest.NewRecorder()

	handler.PlaygroundChatCompletion(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var envelope struct {
		Status string `json:"status"`
		Data   struct {
			FinishReason string `json:"finish_reason"`
			Message      struct {
				Content string `json:"content"`
			} `json:"message"`
			ToolTrace []struct {
				Name       string `json:"name"`
				Method     string `json:"method"`
				URL        string `json:"url"`
				StatusCode int    `json:"status_code"`
				Response   string `json:"response"`
			} `json:"tool_trace"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &envelope); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if envelope.Status != "success" {
		t.Fatalf("expected success, got %s", envelope.Status)
	}
	if envelope.Data.FinishReason != "stop" {
		t.Fatalf("expected stop finish reason, got %s", envelope.Data.FinishReason)
	}
	if envelope.Data.Message.Content != "done" {
		t.Fatalf("expected final assistant text, got %q", envelope.Data.Message.Content)
	}
	if len(envelope.Data.ToolTrace) != 1 {
		t.Fatalf("expected 1 tool trace item, got %d", len(envelope.Data.ToolTrace))
	}
	if envelope.Data.ToolTrace[0].Name != "hello_tool" {
		t.Fatalf("expected trace for hello_tool, got %s", envelope.Data.ToolTrace[0].Name)
	}
	if envelope.Data.ToolTrace[0].StatusCode != http.StatusOK {
		t.Fatalf("expected tool status 200, got %d", envelope.Data.ToolTrace[0].StatusCode)
	}
	if !strings.Contains(envelope.Data.ToolTrace[0].Response, "tool-called") {
		t.Fatalf("expected tool response in trace, got %s", envelope.Data.ToolTrace[0].Response)
	}
}

func TestCreateToolRecordRejectsInvalidDescriptor(t *testing.T) {
	services := application.NewInMemoryServices()
	toolCollection, err := services.Tools.CreateCollection(nil, application.CreateToolCollectionRequest{
		Scope: domain.ScopeGlobal,
		Name:  "tools",
	})
	if err != nil {
		t.Fatalf("create tool collection: %v", err)
	}

	handler := New(Deps{Tools: services.Tools})
	req := httptest.NewRequest(http.MethodPost, "/api/admin/tools/collections/"+toolCollection.ID+"/records", strings.NewReader(`{"key":"broken","value":"not-json"}`))
	req.Header.Set("content-type", "application/json")
	rr := httptest.NewRecorder()

	handler.CreateToolRecord(rr, req)

	if rr.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "invalid_tool_descriptor") {
		t.Fatalf("expected invalid_tool_descriptor error, got %s", rr.Body.String())
	}
}
