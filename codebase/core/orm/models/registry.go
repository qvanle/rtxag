package models

func AllModels() []interface{} {
	return []interface{}{
		&Tenant{},
		&Plan{},
		&Provider{},
		&Model{},
		&RetrievalCollection{},
		&RetrievalDocument{},
		&MCPCollection{},
		&MCPRecord{},
		&Assistant{},
		&AssistantModel{},
		&AssistantRetrievalCollection{},
		&AssistantMCPCollection{},
		&APIRequestMetricsHourly{},
		&AuditEvent{},
	}
}
