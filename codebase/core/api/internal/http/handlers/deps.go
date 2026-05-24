package handlers

import "rotexai/core/api/internal/application"

type Deps struct {
	Dashboard application.DashboardService
	Tenant    application.TenantService
	Model     application.ModelService
	Provider  application.ProviderService
	Retrieval application.RetrievalService
	MCP       application.MCPService
	Assistant application.AssistantService
}
