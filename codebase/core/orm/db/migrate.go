package db

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gorm.io/gorm"
)

func ApplySQLMigrations(db *gorm.DB, migrationDir string) error {
	entries, err := os.ReadDir(migrationDir)
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	files := make([]string, 0)
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if strings.HasSuffix(entry.Name(), ".sql") {
			files = append(files, entry.Name())
		}
	}
	sort.Strings(files)

	for _, file := range files {
		path := filepath.Join(migrationDir, file)
		raw, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", file, err)
		}
		statements := splitSQLStatements(string(raw))
		for _, stmt := range statements {
			if err := db.Exec(stmt).Error; err != nil {
				return fmt.Errorf("apply migration %s: %w", file, err)
			}
		}
	}

	return nil
}

func splitSQLStatements(input string) []string {
	var (
		stmts         []string
		sb            strings.Builder
		inSingleQuote bool
		inDollarQuote bool
	)

	for i := 0; i < len(input); i++ {
		ch := input[i]

		// Toggle dollar-quote on $$ markers (used by plpgsql blocks)
		if !inSingleQuote && i+1 < len(input) && input[i] == '$' && input[i+1] == '$' {
			inDollarQuote = !inDollarQuote
			sb.WriteByte(input[i])
			sb.WriteByte(input[i+1])
			i++
			continue
		}

		// Toggle single quotes when not inside dollar quote
		if !inDollarQuote && ch == '\'' {
			inSingleQuote = !inSingleQuote
			sb.WriteByte(ch)
			continue
		}

		// Statement boundary
		if !inSingleQuote && !inDollarQuote && ch == ';' {
			stmt := strings.TrimSpace(sb.String())
			if stmt != "" {
				stmts = append(stmts, stmt)
			}
			sb.Reset()
			continue
		}

		sb.WriteByte(ch)
	}

	last := strings.TrimSpace(sb.String())
	if last != "" {
		stmts = append(stmts, last)
	}

	return stmts
}
