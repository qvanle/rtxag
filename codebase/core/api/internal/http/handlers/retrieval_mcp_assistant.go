package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"rotexai/core/api/internal/application"
	"rotexai/core/api/internal/domain"
	"rotexai/core/api/internal/http/middleware"
	"rotexai/core/api/internal/http/response"
)

func (h *Handler) ListRetrievalCollections(w http.ResponseWriter, r *http.Request) {
	scope, tenantID, ok := scopeAndTenant(w, r)
	if !ok {
		return
	}
	rows, err := h.deps.Retrieval.ListCollections(r.Context(), scope, tenantID)
	if err != nil {
		response.Error(w, 500, "list_retrieval_collections_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, rows, nil)
}
func (h *Handler) CreateRetrievalCollection(w http.ResponseWriter, r *http.Request) {
	var req application.CreateRetrievalCollectionRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.Scope == domain.ScopeTenant {
		principal, _ := principalFromRequest(r)
		req.TenantID = principal.TenantID
	}
	row, err := h.deps.Retrieval.CreateCollection(r.Context(), req)
	if err != nil {
		response.Error(w, 422, "create_retrieval_collection_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 201, row, nil)
}
func (h *Handler) GetRetrievalCollection(w http.ResponseWriter, r *http.Request) {
	row, err := h.deps.Retrieval.GetCollection(r.Context(), chi.URLParam(r, "collection_id"))
	if err != nil {
		response.Error(w, 404, "retrieval_collection_not_found", err.Error(), nil)
		return
	}
	response.JSON(w, 200, row, nil)
}
func (h *Handler) UpdateRetrievalCollection(w http.ResponseWriter, r *http.Request) {
	var req application.UpdateRetrievalCollectionRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	row, err := h.deps.Retrieval.UpdateCollection(r.Context(), chi.URLParam(r, "collection_id"), req)
	if err != nil {
		response.Error(w, 422, "update_retrieval_collection_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, row, nil)
}
func (h *Handler) DeleteRetrievalCollection(w http.ResponseWriter, r *http.Request) {
	if err := h.deps.Retrieval.DeleteCollection(r.Context(), chi.URLParam(r, "collection_id")); err != nil {
		response.Error(w, 409, "delete_retrieval_collection_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, map[string]bool{"ok": true}, nil)
}
func (h *Handler) ListRetrievalDocuments(w http.ResponseWriter, r *http.Request) {
	rows, err := h.deps.Retrieval.ListDocuments(r.Context(), chi.URLParam(r, "collection_id"))
	if err != nil {
		response.Error(w, 500, "list_documents_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, rows, nil)
}
func (h *Handler) CreateRetrievalDocument(w http.ResponseWriter, r *http.Request) {
	var req application.CreateRetrievalDocumentRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	row, err := h.deps.Retrieval.CreateDocument(r.Context(), chi.URLParam(r, "collection_id"), req)
	if err != nil {
		response.Error(w, 422, "create_document_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 201, row, nil)
}
func (h *Handler) DeleteRetrievalDocument(w http.ResponseWriter, r *http.Request) {
	if err := h.deps.Retrieval.DeleteDocument(r.Context(), chi.URLParam(r, "collection_id"), chi.URLParam(r, "document_id")); err != nil {
		response.Error(w, 409, "delete_document_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, map[string]bool{"ok": true}, nil)
}
func (h *Handler) ReindexRetrievalCollection(w http.ResponseWriter, r *http.Request) {
	if err := h.deps.Retrieval.ReindexCollection(r.Context(), chi.URLParam(r, "collection_id")); err != nil {
		response.Error(w, 422, "reindex_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, map[string]bool{"ok": true}, nil)
}

func (h *Handler) ListToolCollections(w http.ResponseWriter, r *http.Request) {
	scope, tenantID, ok := scopeAndTenant(w, r)
	if !ok {
		return
	}
	rows, err := h.deps.Tools.ListCollections(r.Context(), scope, tenantID)
	if err != nil {
		response.Error(w, 500, "list_tool_collections_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, rows, nil)
}
func (h *Handler) CreateToolCollection(w http.ResponseWriter, r *http.Request) {
	var req application.CreateToolCollectionRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.Scope == domain.ScopeTenant {
		principal, _ := principalFromRequest(r)
		req.TenantID = principal.TenantID
	}
	row, err := h.deps.Tools.CreateCollection(r.Context(), req)
	if err != nil {
		response.Error(w, 422, "create_tool_collection_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 201, row, nil)
}
func (h *Handler) GetToolCollection(w http.ResponseWriter, r *http.Request) {
	row, err := h.deps.Tools.GetCollection(r.Context(), chi.URLParam(r, "collection_id"))
	if err != nil {
		response.Error(w, 404, "tool_collection_not_found", err.Error(), nil)
		return
	}
	response.JSON(w, 200, row, nil)
}
func (h *Handler) UpdateToolCollection(w http.ResponseWriter, r *http.Request) {
	var req application.UpdateToolCollectionRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	row, err := h.deps.Tools.UpdateCollection(r.Context(), chi.URLParam(r, "collection_id"), req)
	if err != nil {
		response.Error(w, 422, "update_tool_collection_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, row, nil)
}
func (h *Handler) DeleteToolCollection(w http.ResponseWriter, r *http.Request) {
	if err := h.deps.Tools.DeleteCollection(r.Context(), chi.URLParam(r, "collection_id")); err != nil {
		response.Error(w, 409, "delete_tool_collection_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, map[string]bool{"ok": true}, nil)
}
func (h *Handler) ListToolRecords(w http.ResponseWriter, r *http.Request) {
	rows, err := h.deps.Tools.ListRecords(r.Context(), chi.URLParam(r, "collection_id"))
	if err != nil {
		response.Error(w, 500, "list_tool_records_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, rows, nil)
}
func (h *Handler) CreateToolRecord(w http.ResponseWriter, r *http.Request) {
	var req application.CreateToolRecordRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	row, err := h.deps.Tools.CreateRecord(r.Context(), chi.URLParam(r, "collection_id"), req)
	if err != nil {
		response.Error(w, 422, "create_tool_record_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 201, row, nil)
}
func (h *Handler) UpdateToolRecord(w http.ResponseWriter, r *http.Request) {
	var req application.UpdateToolRecordRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	row, err := h.deps.Tools.UpdateRecord(r.Context(), chi.URLParam(r, "collection_id"), chi.URLParam(r, "record_id"), req)
	if err != nil {
		response.Error(w, 422, "update_tool_record_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, row, nil)
}
func (h *Handler) DeleteToolRecord(w http.ResponseWriter, r *http.Request) {
	if err := h.deps.Tools.DeleteRecord(r.Context(), chi.URLParam(r, "collection_id"), chi.URLParam(r, "record_id")); err != nil {
		response.Error(w, 409, "delete_tool_record_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, map[string]bool{"ok": true}, nil)
}

func (h *Handler) ListAssistants(w http.ResponseWriter, r *http.Request) {
	scope, tenantID, ok := scopeAndTenant(w, r)
	if !ok {
		return
	}
	rows, err := h.deps.Assistant.List(r.Context(), scope, tenantID)
	if err != nil {
		response.Error(w, 500, "list_assistants_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, rows, nil)
}
func (h *Handler) CreateAssistant(w http.ResponseWriter, r *http.Request) {
	var req application.CreateAssistantRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.Scope == domain.ScopeTenant {
		principal, _ := principalFromRequest(r)
		req.TenantID = principal.TenantID
	}
	row, err := h.deps.Assistant.Create(r.Context(), req)
	if err != nil {
		response.Error(w, 422, "create_assistant_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 201, row, nil)
}
func (h *Handler) GetAssistant(w http.ResponseWriter, r *http.Request) {
	row, err := h.deps.Assistant.Get(r.Context(), chi.URLParam(r, "assistant_id"))
	if err != nil {
		response.Error(w, 404, "assistant_not_found", err.Error(), nil)
		return
	}
	response.JSON(w, 200, row, nil)
}
func (h *Handler) UpdateAssistant(w http.ResponseWriter, r *http.Request) {
	var req application.UpdateAssistantRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	row, err := h.deps.Assistant.Update(r.Context(), chi.URLParam(r, "assistant_id"), req)
	if err != nil {
		response.Error(w, 422, "update_assistant_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, row, nil)
}
func (h *Handler) DeleteAssistant(w http.ResponseWriter, r *http.Request) {
	if err := h.deps.Assistant.Delete(r.Context(), chi.URLParam(r, "assistant_id")); err != nil {
		response.Error(w, 409, "delete_assistant_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, map[string]bool{"ok": true}, nil)
}
func (h *Handler) ActivateAssistant(w http.ResponseWriter, r *http.Request) {
	if err := h.deps.Assistant.Activate(r.Context(), chi.URLParam(r, "assistant_id")); err != nil {
		response.Error(w, 422, "activate_assistant_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, map[string]bool{"ok": true}, nil)
}
func (h *Handler) CloneAssistant(w http.ResponseWriter, r *http.Request) {
	var req application.CloneAssistantRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.TargetScope == domain.ScopeTenant {
		principal, _ := principalFromRequest(r)
		req.TargetTenantID = principal.TenantID
	}
	row, err := h.deps.Assistant.Clone(r.Context(), chi.URLParam(r, "assistant_id"), req)
	if err != nil {
		response.Error(w, 422, "clone_assistant_failed", err.Error(), nil)
		return
	}
	response.JSON(w, 200, row, nil)
}

func principalFromRequest(r *http.Request) (domain.Principal, bool) {
	return middleware.PrincipalFromContext(r.Context())
}
