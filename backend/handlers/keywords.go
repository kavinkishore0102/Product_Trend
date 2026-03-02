package handlers

import (
	"net/http"
	"strings"
	"trendspy/backend/data"
	"trendspy/backend/models"
)

// SearchKeywords returns keywords filtered by a query string
func SearchKeywords(w http.ResponseWriter, r *http.Request) {
	q := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))

	results := make([]models.Keyword, 0)
	for _, k := range data.Keywords {
		if q == "" || strings.Contains(strings.ToLower(k.Keyword), q) {
			results = append(results, k)
		}
	}

	// Also add search volume trend
	type enriched struct {
		models.Keyword
		VolumeHistory []models.HistoryPoint `json:"volume_history"`
	}

	enrichedResults := make([]enriched, 0, len(results))
	for _, k := range results {
		trend := "stable"
		if k.Trend > 10 {
			trend = "rising"
		} else if k.Trend < -5 {
			trend = "declining"
		}
		history := data.GenerateSearchVolumeHistory(k.SearchVolume, trend)
		enrichedResults = append(enrichedResults, enriched{Keyword: k, VolumeHistory: history})
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"query":    r.URL.Query().Get("q"),
		"total":    len(enrichedResults),
		"keywords": enrichedResults,
	})
}

// GetReverseASIN returns all keywords that a product ranks for.
// Works for any ASIN — unknown ones get a synthetic product then match keywords.
func GetReverseASIN(w http.ResponseWriter, r *http.Request) {
	asin := strings.ToUpper(r.PathValue("asin"))

	// Check product exists, fallback to generated
	p, ok := data.GetProductByASIN(asin)
	var productName string
	if !ok {
		gen := data.GenerateProductFromASIN(asin)
		productName = gen.Name
	} else {
		productName = p.Name
	}

	// Find all keywords that list this ASIN as top or related
	result := make([]models.ReverseASINKeyword, 0)
	for _, k := range data.Keywords {
		isTop := k.TopASIN == asin
		isRelated := false
		for _, r := range k.RelatedASINs {
			if r == asin {
				isRelated = true
				break
			}
		}
		if !isTop && !isRelated {
			continue
		}

		var organicRank *int
		var sponsoredRank *int

		if isTop {
			rank := 1 + (len(k.Keyword) % 5)
			organicRank = &rank
			if k.Difficulty > 50 {
				srank := 1 + (len(k.Keyword) % 3)
				sponsoredRank = &srank
			}
		} else if isRelated {
			rank := 6 + (len(k.Keyword) % 15)
			organicRank = &rank
		}

		result = append(result, models.ReverseASINKeyword{
			Keyword:       k.Keyword,
			SearchVolume:  k.SearchVolume,
			Trend:         k.Trend,
			CPC:           k.CPC,
			Competition:   k.Competition,
			Difficulty:    k.Difficulty,
			OrganicRank:   organicRank,
			SponsoredRank: sponsoredRank,
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"asin":     asin,
		"product":  productName,
		"total":    len(result),
		"keywords": result,
	})
}
