module rotexai/core/services

go 1.23

require (
	github.com/google/uuid v1.3.0
	gorm.io/gorm v1.25.12
	rotexai/core/orm v0.0.0
	rotexai/core/schemas v0.0.0
)

require (
	filippo.io/edwards25519 v1.1.0 // indirect
	github.com/go-sql-driver/mysql v1.8.1 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	golang.org/x/text v0.14.0 // indirect
	gorm.io/datatypes v1.2.4 // indirect
	gorm.io/driver/mysql v1.5.6 // indirect
)

replace rotexai/core/orm => ../orm

replace rotexai/core/schemas => ../schemas
