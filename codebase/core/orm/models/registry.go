package models

func AllModels() []interface{} {
	return []interface{}{
		&Tenant{},
		&Plan{},
		&Provider{},
		&Model{},
		&RetrievalCollection{},
		&RetrievalDocument{},
		&ToolCollection{},
		&ToolRecord{},
		&Assistant{},
		&AssistantModel{},
		&AssistantRetrievalCollection{},
		&AssistantToolCollection{},
		&APIRequestMetricsHourly{},
		&AuditEvent{},
	}
}
