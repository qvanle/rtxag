package main

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}

func TestExecuteToolCall(t *testing.T) {
	var calls int32
	client := &http.Client{
		Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
			atomic.AddInt32(&calls, 1)
			if r.Method != http.MethodPost {
				t.Fatalf("expected POST, got %s", r.Method)
			}
			if r.URL.String() != "http://tool.local/hello" {
				t.Fatalf("unexpected tool URL %s", r.URL.String())
			}
			body, _ := io.ReadAll(r.Body)
			if !strings.Contains(string(body), "world") {
				t.Fatalf("expected payload to contain world, got %s", string(body))
			}
			return &http.Response{
				StatusCode: http.StatusOK,
				Header:     http.Header{"Content-Type": []string{"application/json"}},
				Body:       io.NopCloser(strings.NewReader(`{"ok":true}`)),
			}, nil
		}),
	}
	srv := &Server{
		client: client,
		executor: func(ctx context.Context, req executeRequest) (toolTraceItem, error) {
			return executeHTTP(ctx, client, req), nil
		},
	}

	req := httptest.NewRequest(http.MethodPost, "/v1/execute", strings.NewReader(`{
		"name":"hello_tool",
		"method":"POST",
		"url":"http://tool.local/hello",
		"arguments":{"name":"world"}
	}`))
	rr := httptest.NewRecorder()

	srv.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var envelope struct {
		Status string `json:"status"`
		Data   struct {
			Name       string `json:"name"`
			Method     string `json:"method"`
			URL        string `json:"url"`
			StatusCode int    `json:"status_code"`
			Response   string `json:"response"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &envelope); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if envelope.Status != "success" {
		t.Fatalf("expected success, got %s", envelope.Status)
	}
	if envelope.Data.Name != "hello_tool" {
		t.Fatalf("expected hello_tool, got %s", envelope.Data.Name)
	}
	if envelope.Data.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", envelope.Data.StatusCode)
	}
	if !strings.Contains(envelope.Data.Response, "ok") {
		t.Fatalf("expected response body, got %s", envelope.Data.Response)
	}
	if atomic.LoadInt32(&calls) != 1 {
		t.Fatalf("expected one outbound call, got %d", calls)
	}
}
