package types

type BaseURLAnalysisData struct {
	URL           string `gorm:"not null;index" json:"url"`
	HTMLVersion   string `json:"htmlVersion"`
	PageTitle     string `json:"pageTitle"`
	InternalLinks int    `json:"internalLinks"`
	ExternalLinks int    `json:"externalLinks"`
	BrokenLinks   int    `json:"brokenLinks"`
	HasLoginForm  bool   `json:"hasLoginForm"`
	Error         string `json:"error,omitempty"`
}
