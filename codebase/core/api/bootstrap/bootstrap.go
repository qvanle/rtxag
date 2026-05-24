package bootstrap

import internal "rotexai/core/api/internal/bootstrap"

type App = internal.App

func NewApp() (*App, error) {
	return internal.NewApp()
}
