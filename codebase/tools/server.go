package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os/exec"
	"strings"
	"time"
)

type envelope struct {
	Status string `json:"status"`
	Data   any    `json:"data,omitempty"`
	Error  any    `json:"error,omitempty"`
}

type executeRequest struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Method    string            `json:"method"`
	URL       string            `json:"url"`
	Headers   map[string]string `json:"headers,omitempty"`
	Arguments map[string]any    `json:"arguments,omitempty"`
	TimeoutMS int               `json:"timeout_ms,omitempty"`
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

type Server struct {
	client        *http.Client
	nsjailPath    string
	sandboxBinary string
	executor      func(context.Context, executeRequest) (toolTraceItem, error)
}

func NewServer(client *http.Client) *Server {
	if client == nil {
		client = &http.Client{}
	}
	s := &Server{
		client:        client,
		nsjailPath:    getOrDefault("NSJAIL_BIN", "/usr/local/bin/nsjail"),
		sandboxBinary: getOrDefault("TOOLS_SANDBOX_BIN", "/app/tools"),
	}
	s.executor = s.executeSandboxed
	return s
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.Method == http.MethodGet && r.URL.Path == "/healthz":
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	case r.Method == http.MethodPost && r.URL.Path == "/v1/execute":
		s.handleExecute(w, r)
	default:
		writeJSON(w, http.StatusNotFound, envelope{
			Status: "error",
			Error: map[string]any{
				"code":    "not_found",
				"message": "not found",
			},
		})
	}
}

func (s *Server) handleExecute(w http.ResponseWriter, r *http.Request) {
	var req executeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, envelope{
			Status: "error",
			Error: map[string]any{
				"code":    "invalid_json",
				"message": "invalid json body",
			},
		})
		return
	}

	executor := s.executor
	if executor == nil {
		executor = s.executeSandboxed
	}
	trace, err := executor(r.Context(), req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, envelope{
			Status: "error",
			Error: map[string]any{
				"code":    "sandbox_failed",
				"message": err.Error(),
			},
		})
		return
	}

	writeJSON(w, http.StatusOK, envelope{Status: "success", Data: trace})
}

func (s *Server) executeSandboxed(ctx context.Context, req executeRequest) (toolTraceItem, error) {
	payload, err := json.Marshal(req)
	if err != nil {
		return toolTraceItem{}, err
	}

	timeout := time.Duration(req.TimeoutMS) * time.Millisecond
	if timeout <= 0 {
		timeout = 10 * time.Second
	}
	execCtx, cancel := context.WithTimeout(ctx, timeout+2*time.Second)
	defer cancel()

	nsjailArgs := []string{
		"-q",
		"-Mo",
		"-N",
		"--chroot", "/",
		"--user", "99999",
		"--group", "99999",
		"--time_limit", fmt.Sprintf("%d", maxInt(1, int(timeout.Seconds())+2)),
		"--",
		s.sandboxBinary,
		"worker",
	}

	cmd := exec.CommandContext(execCtx, s.nsjailPath, nsjailArgs...)
	cmd.Stdin = bytes.NewReader(payload)

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		if execCtx.Err() != nil {
			return toolTraceItem{
				ID:     req.ID,
				Name:   strings.TrimSpace(req.Name),
				Method: strings.ToUpper(strings.TrimSpace(req.Method)),
				URL:    strings.TrimSpace(req.URL),
				Error:  execCtx.Err().Error(),
			}, nil
		}
		errText := strings.TrimSpace(stderr.String())
		if errText == "" {
			errText = err.Error()
		}
		return toolTraceItem{
			ID:     req.ID,
			Name:   strings.TrimSpace(req.Name),
			Method: strings.ToUpper(strings.TrimSpace(req.Method)),
			URL:    strings.TrimSpace(req.URL),
			Error:  errText,
		}, nil
	}

	var response envelope
	if err := json.Unmarshal(stdout.Bytes(), &response); err != nil {
		return toolTraceItem{
			ID:     req.ID,
			Name:   strings.TrimSpace(req.Name),
			Method: strings.ToUpper(strings.TrimSpace(req.Method)),
			URL:    strings.TrimSpace(req.URL),
			Error:  err.Error(),
		}, nil
	}
	if strings.TrimSpace(response.Status) != "success" {
		return toolTraceItem{
			ID:     req.ID,
			Name:   strings.TrimSpace(req.Name),
			Method: strings.ToUpper(strings.TrimSpace(req.Method)),
			URL:    strings.TrimSpace(req.URL),
			Error:  fmt.Sprintf("sandbox returned status %s", response.Status),
		}, nil
	}

	var trace toolTraceItem
	raw, err := json.Marshal(response.Data)
	if err != nil {
		return toolTraceItem{
			ID:     req.ID,
			Name:   strings.TrimSpace(req.Name),
			Method: strings.ToUpper(strings.TrimSpace(req.Method)),
			URL:    strings.TrimSpace(req.URL),
			Error:  err.Error(),
		}, nil
	}
	if err := json.Unmarshal(raw, &trace); err != nil {
		return toolTraceItem{
			ID:     req.ID,
			Name:   strings.TrimSpace(req.Name),
			Method: strings.ToUpper(strings.TrimSpace(req.Method)),
			URL:    strings.TrimSpace(req.URL),
			Error:  err.Error(),
		}, nil
	}
	return trace, nil
}

func executeHTTP(ctx context.Context, client *http.Client, req executeRequest) toolTraceItem {
	if client == nil {
		client = &http.Client{}
	}

	method := strings.ToUpper(strings.TrimSpace(req.Method))
	if method == "" {
		method = http.MethodGet
	}

	targetURL, err := url.Parse(strings.TrimSpace(req.URL))
	if err != nil {
		return toolTraceItem{ID: req.ID, Name: strings.TrimSpace(req.Name), Method: method, URL: req.URL, Error: err.Error()}
	}

	var body io.Reader
	switch method {
	case http.MethodGet, http.MethodDelete, http.MethodHead:
		query := targetURL.Query()
		for key, value := range req.Arguments {
			query.Set(key, stringifyToolArg(value))
		}
		targetURL.RawQuery = query.Encode()
	default:
		payload, err := json.Marshal(req.Arguments)
		if err != nil {
			return toolTraceItem{ID: req.ID, Name: strings.TrimSpace(req.Name), Method: method, URL: targetURL.String(), Error: err.Error()}
		}
		body = bytes.NewReader(payload)
	}

	timeout := time.Duration(req.TimeoutMS) * time.Millisecond
	if timeout <= 0 {
		timeout = 10 * time.Second
	}
	callCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	httpReq, err := http.NewRequestWithContext(callCtx, method, targetURL.String(), body)
	if err != nil {
		return toolTraceItem{ID: req.ID, Name: strings.TrimSpace(req.Name), Method: method, URL: targetURL.String(), Error: err.Error()}
	}

	for key, value := range req.Headers {
		if strings.TrimSpace(key) == "" {
			continue
		}
		httpReq.Header.Set(key, value)
	}
	if body != nil && httpReq.Header.Get("content-type") == "" {
		httpReq.Header.Set("content-type", "application/json")
	}

	resp, err := client.Do(httpReq)
	if err != nil {
		return toolTraceItem{ID: req.ID, Name: strings.TrimSpace(req.Name), Method: method, URL: targetURL.String(), Error: err.Error()}
	}
	defer resp.Body.Close()

	limited := io.LimitReader(resp.Body, 1<<20)
	raw, _ := io.ReadAll(limited)
	responseText := strings.TrimSpace(string(raw))
	if len(responseText) > 8192 {
		responseText = responseText[:8192]
	}

	return toolTraceItem{
		ID:         strings.TrimSpace(req.ID),
		Name:       strings.TrimSpace(req.Name),
		Method:     method,
		URL:        targetURL.String(),
		StatusCode: resp.StatusCode,
		Response:   responseText,
	}
}

func stringifyToolArg(v any) string {
	switch value := v.(type) {
	case string:
		return value
	case fmt.Stringer:
		return value.String()
	case float64:
		return strings.TrimRight(strings.TrimRight(fmt.Sprintf("%f", value), "0"), ".")
	default:
		raw, err := json.Marshal(value)
		if err != nil {
			return fmt.Sprint(value)
		}
		return string(raw)
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}
