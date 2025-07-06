package services

import (
	"github.com/sykell-challenge/server/internal/database"
	"github.com/sykell-challenge/server/internal/models"
	"gorm.io/gorm"
)

type URLAnalysisService struct {
	db *gorm.DB
}

func NewURLAnalysisService() *URLAnalysisService {
	return &URLAnalysisService{
		db: database.GetDB(),
	}
}

func (s *URLAnalysisService) SaveAnalysis(analysis *models.URLAnalysis) error {
	return s.db.Create(analysis).Error
}

func (s *URLAnalysisService) GetAnalysisByURL(url string) (*models.URLAnalysis, error) {
	var analysis models.URLAnalysis
	err := s.db.Preload("HeadingCounts").
		Where("url = ?", url).
		Order("created_at DESC").
		First(&analysis).Error
	
	if err != nil {
		return nil, err
	}
	
	return &analysis, nil
}