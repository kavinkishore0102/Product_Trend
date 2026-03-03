package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"trendspy/backend/scraper"
)

// DiscoverProducts handles GET /api/discover
// Query params: category, price_min, price_max, competition, revenue_min, size
func DiscoverProducts(w http.ResponseWriter, r *http.Request) {
	if !scraper.CfgOK {
		writeError(w, http.StatusServiceUnavailable,
			"ScraperAPI not configured — set SCRAPER_API_KEY environment variable")
		return
	}

	filter := scraper.DiscoverFilter{
		Category:    strings.ToLower(strings.TrimSpace(r.URL.Query().Get("category"))),
		Competition: strings.ToLower(strings.TrimSpace(r.URL.Query().Get("competition"))),
		Size:        strings.Title(strings.ToLower(strings.TrimSpace(r.URL.Query().Get("size")))),
	}

	if v, err := strconv.ParseFloat(r.URL.Query().Get("price_min"), 64); err == nil {
		filter.PriceMin = v
	}
	if v, err := strconv.ParseFloat(r.URL.Query().Get("price_max"), 64); err == nil {
		filter.PriceMax = v
	}
	if v, err := strconv.ParseFloat(r.URL.Query().Get("revenue_min"), 64); err == nil {
		filter.RevenueMin = v
	}

	if filter.Category == "" {
		filter.Category = "electronics"
	}

	// Fetch and parse Amazon search results
	raw, err := scraper.SearchAmazon(scraper.Cfg, filter)
	if err != nil {
		writeError(w, http.StatusBadGateway, "Amazon search failed: "+err.Error())
		return
	}

	// Score, filter, and rank products
	products := scraper.ScoreAndFilter(raw, filter)

	// Build response
	type ResponseProduct struct {
		ASIN              string   `json:"asin"`
		Title             string   `json:"title"`
		Price             float64  `json:"price"`
		Rating            float64  `json:"rating"`
		Reviews           int      `json:"reviews"`
		ImageURL          string   `json:"image_url"`
		Category          string   `json:"category"`
		DiscoveryScore    int      `json:"discovery_score"`
		Reasons           []string `json:"reasons"`
		EstMonthlyRevenue float64  `json:"est_monthly_revenue"`
		EstMonthlySales   int      `json:"est_monthly_sales"`
		CompetitionLevel  string   `json:"competition_level"`
		SizeEstimate      string   `json:"size_estimate"`
	}

	resp := make([]ResponseProduct, 0, len(products))
	for _, p := range products {
		resp = append(resp, ResponseProduct{
			ASIN:              p.ASIN,
			Title:             p.Title,
			Price:             p.Price,
			Rating:            p.Rating,
			Reviews:           p.Reviews,
			ImageURL:          p.ImageURL,
			Category:          p.Category,
			DiscoveryScore:    p.DiscoveryScore,
			Reasons:           p.Reasons,
			EstMonthlyRevenue: p.EstMonthlyRevenue,
			EstMonthlySales:   p.EstMonthlySales,
			CompetitionLevel:  p.CompetitionLevel,
			SizeEstimate:      p.SizeEstimate,
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"total":    len(resp),
		"filter":   filter,
		"products": resp,
	})
}
