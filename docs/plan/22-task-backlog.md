# Task Backlog

## Priority P0
- `P0-01` Implement Retrieval service + GORM repository.
- `P0-02` Wire Retrieval API adapters and replace in-memory dependency.
- `P0-03` Add Retrieval unit/integration tests.

## Priority P1
- `P1-01` Implement MCP service + GORM repository.
- `P1-02` Wire MCP API adapters.
- `P1-03` Add MCP tests.

## Priority P1
- `P1-04` Implement Assistant service/repository with transactions.
- `P1-05` Wire Assistant API adapters.
- `P1-06` Add Assistant composition validation tests.

## Priority P2
- `P2-01` Implement Dashboard aggregation repository and service.
- `P2-02` Wire Dashboard API adapters.
- `P2-03` Add dashboard query tests.

## Priority P2
- `P2-04` Add full API integration suite.
- `P2-05` Add compose smoke test scripts and CI integration.

## Dependencies
- `P1-04` depends on `P0-01` and `P1-01`.
- `P2-01` depends on metrics data strategy availability.
