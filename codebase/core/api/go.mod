module rotexai/core/api

go 1.23

require (
	github.com/go-chi/chi/v5 v5.1.0
	github.com/go-chi/httplog/v2 v2.1.1
	github.com/google/uuid v1.6.0
	gorm.io/driver/postgres v1.5.9
	gorm.io/gorm v1.25.12
	rotexai/core/orm v0.0.0
	rotexai/core/schemas v0.0.0
	rotexai/core/services v0.0.0
)

replace rotexai/core/orm => ../orm

replace rotexai/core/schemas => ../schemas

replace rotexai/core/services => ../services

require (
	filippo.io/edwards25519 v1.1.0 // indirect
	github.com/go-sql-driver/mysql v1.8.1 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20231201235250-de7065d80cb9 // indirect
	github.com/jackc/pgx/v5 v5.5.5 // indirect
	github.com/jackc/puddle/v2 v2.2.1 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	golang.org/x/crypto v0.22.0 // indirect
	golang.org/x/sync v0.1.0 // indirect
	golang.org/x/text v0.14.0 // indirect
	gorm.io/datatypes v1.2.4 // indirect
	gorm.io/driver/mysql v1.5.6 // indirect
)
