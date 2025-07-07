package models

import (
	"time"

	"github.com/sykell-challenge/server/internal/types"
)

type BaseModel struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type URLAnalysis struct {
	BaseModel
	types.BaseURLAnalysisData

	HeadingCounts []HeadingCount `gorm:"foreignKey:URLAnalysisID;constraint:OnDelete:CASCADE" json:"headingCounts"`
	BrokenLinks   []BrokenLink   `gorm:"foreignKey:URLAnalysisID;constraint:OnDelete:CASCADE" json:"brokenLinks"`
}

type HeadingCount struct {
	BaseModel
	URLAnalysisID uint   `gorm:"not null;index" json:"urlAnalysisId"`
	Level         string `gorm:"not null" json:"level"`
	Count         int    `gorm:"not null" json:"count"`
}

type BrokenLink struct {
	BaseModel
	URLAnalysisID uint   `gorm:"not null;index" json:"urlAnalysisId"`
	URL           string `gorm:"not null" json:"url"`
	StatusCode    int    `json:"statusCode"`
	Error         string `json:"error,omitempty"`
}

func (URLAnalysis) TableName() string {
	return "url_analyses"
}

func (HeadingCount) TableName() string {
	return "heading_counts"
}

func (BrokenLink) TableName() string {
	return "broken_links"
}