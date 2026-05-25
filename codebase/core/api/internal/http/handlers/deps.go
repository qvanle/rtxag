package handlers

import "rotexai/core/api/internal/application"

type Deps struct {
	Dashboard    application.DashboardService
	Tenant       application.TenantService
	Provider     application.ProviderService
	Retrieval    application.RetrievalService
	Tools        application.ToolsService
	Assistant    application.AssistantService
	LLMHubOrigin string
}
