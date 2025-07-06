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
}

type HeadingCount struct {
	BaseModel
	URLAnalysisID uint   `gorm:"not null;index" json:"urlAnalysisId"`
	Level         string `gorm:"not null" json:"level"`
	Count         int    `gorm:"not null" json:"count"`
}

func (URLAnalysis) TableName() string {
	return "url_analyses"
}

func (HeadingCount) TableName() string {
	return "heading_counts"
}