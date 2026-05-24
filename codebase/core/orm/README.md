# RotexAI Core ORM

Core ORM package for Admin domain using GORM + PostgreSQL.

## Structure
- `models/`: GORM model definitions
- `migrations/`: SQL migrations (authoritative schema)
- `db/`: DB connection and migration runner
- root command `go run . orm-migrate`

## Usage
```bash
export ROTEXAI_ORM_DSN='postgres://user:pass@localhost:5432/rotexai?sslmode=disable'
go run . orm-migrate
```
