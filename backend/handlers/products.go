package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"trendspy/backend/data"
	"trendspy/backend/keepa"
	"trendspy/backend/models"
	"trendspy/backend/paapi"
	"trendspy/backend/scraper"
)

// writeJSON sends a JSON response with the given status code
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// writeError sends a JSON error response
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// ---- /api/products ----

// GetProducts returns all products, optionally filtered by category
func GetProducts(w http.ResponseWriter, r *http.Request) {
	cat := strings.TrimSpace(r.URL.Query().Get("category"))
	limit := 100
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 500 {
			limit = n
		}
	}

	result := make([]models.Product, 0, len(data.Products))
	for _, p := range data.Products {
		if cat != "" && !strings.EqualFold(p.Category, cat) {
			continue
		}
		result = append(result, p)
		if len(result) >= limit {
			break
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"total":    len(result),
		"products": result,
	})
}

// SearchProducts does full-text search across name, asin, brand, category, tags
func SearchProducts(w http.ResponseWriter, r *http.Request) {
	q := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	cat := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("category")))

	results := make([]models.Product, 0)
	for _, p := range data.Products {
		// category filter
		if cat != "" && !strings.Contains(strings.ToLower(p.Category), cat) {
			continue
		}
		// full-text match
		if q == "" ||
			strings.Contains(strings.ToLower(p.ASIN), q) ||
			strings.Contains(strings.ToLower(p.Name), q) ||
			strings.Contains(strings.ToLower(p.Brand), q) ||
			strings.Contains(strings.ToLower(p.Category), q) ||
			strings.Contains(strings.ToLower(p.SubCategory), q) ||
			containsTag(p.Tags, q) {
			results = append(results, p)
		}
	}

	writeJSON(w, http.StatusOK, models.SearchResult{
		Query:    r.URL.Query().Get("q"),
		Total:    len(results),
		Products: results,
	})
}

func containsTag(tags []string, q string) bool {
	for _, t := range tags {
		if strings.Contains(strings.ToLower(t), q) {
			return true
		}
	}
	return false
}

// GetProductByASIN returns a single product.
// Priority: 1) Seed  2) ScraperAPI (real HTML)  3) Keepa  4) PA API  5) Synthetic
func GetProductByASIN(w http.ResponseWriter, r *http.Request) {
	asin := strings.ToUpper(strings.TrimSpace(r.PathValue("asin")))
	if len(asin) < 3 {
		writeError(w, http.StatusBadRequest, "invalid ASIN")
		return
	}

	// 1. Seed catalog
	if p, ok := data.GetProductByASIN(asin); ok {
		writeJSON(w, http.StatusOK, p)
		return
	}

	// 2. Synthetic base (always generated, overlaid by real data below)
	product := data.GenerateProductFromASIN(asin)

	// Helper: overlay real data onto product
	applyScraperData := func(sd scraper.ProductData) {
		if sd.Title != "" {
			product.Name = sd.Title
		}
		if sd.Brand != "" {
			product.Brand = sd.Brand
		}
		if sd.Category != "" {
			product.Category = sd.Category
			product.BSRCategory = sd.Category
		}
		if sd.Price > 0 {
			product.Price = sd.Price
		}
		if sd.ImageURL != "" {
			product.Image = sd.ImageURL
		}
		if sd.Rating > 0 {
			product.Rating = sd.Rating
		}
		if sd.Reviews > 0 {
			product.Reviews = sd.Reviews
		}
	}

	// 3. ScraperAPI — best free real-data source
	if scraper.CfgOK {
		if sd, err := scraper.Lookup(scraper.Cfg, asin); err == nil && sd.Found {
			applyScraperData(sd)
		}
	} else if keepa.CfgOK {
		// 4. Keepa fallback
		if kd, err := keepa.GetProduct(keepa.Cfg, asin); err == nil && kd.Found {
			if kd.Title != "" {
				product.Name = kd.Title
			}
			if kd.Brand != "" {
				product.Brand = kd.Brand
			}
			if kd.Category != "" {
				product.Category = kd.Category
				product.BSRCategory = kd.Category
			}
			if kd.Price > 0 {
				product.Price = kd.Price
			}
			if kd.ImageURL != "" {
				product.Image = kd.ImageURL
			}
			if kd.Rating > 0 {
				product.Rating = kd.Rating
			}
			if kd.Reviews > 0 {
				product.Reviews = kd.Reviews
			}
			if kd.BSR > 0 {
				product.BSR = kd.BSR
			}
		}
	} else if pd, found := paapi.LookupWithCache(paapi.Cfg, paapi.CfgOK, asin); found {
		// 5. PA API fallback
		if pd.Title != "" {
			product.Name = pd.Title
		}
		if pd.Brand != "" {
			product.Brand = pd.Brand
		}
		if pd.Category != "" {
			product.Category = pd.Category
			product.BSRCategory = pd.Category + " > General"
		}
		if pd.Price > 0 {
			product.Price = pd.Price
		}
		if pd.ImageURL != "" {
			product.Image = pd.ImageURL
		}
	}

	writeJSON(w, http.StatusOK, product)
}

// GetProductHistory returns 12-month BSR, price, and sales history.
// Uses real price from ScraperAPI when available, falls back to synthetic.
func GetProductHistory(w http.ResponseWriter, r *http.Request) {
	asin := strings.ToUpper(strings.TrimSpace(r.PathValue("asin")))
	if len(asin) < 3 {
		writeError(w, http.StatusBadRequest, "invalid ASIN")
		return
	}

	var product models.Product
	if p, ok := data.GetProductByASIN(asin); ok {
		product = *p
	} else {
		product = data.GenerateProductFromASIN(asin)
		// Overlay real price if ScraperAPI is configured
		if scraper.CfgOK {
			if sd, err := scraper.Lookup(scraper.Cfg, asin); err == nil && sd.Found && sd.Price > 0 {
				product.Price = sd.Price
			}
		}
	}

	history := models.ProductHistory{
		ASIN:  product.ASIN,
		BSR:   data.GenerateBSRHistory(product.BSR, product.Trend),
		Price: data.GeneratePriceHistory(product.Price),
		Sales: data.GenerateSalesHistory(product.MonthlySales, product.Trend),
	}
	writeJSON(w, http.StatusOK, history)
}

// ---- /api/categories ----

// GetCategories returns distinct categories with product counts
func GetCategories(w http.ResponseWriter, r *http.Request) {
	counts := map[string]int{}
	for _, p := range data.Products {
		counts[p.Category]++
	}
	type catItem struct {
		Name  string `json:"name"`
		Count int    `json:"count"`
	}
	items := make([]catItem, 0, len(counts))
	for name, count := range counts {
		items = append(items, catItem{Name: name, Count: count})
	}
	writeJSON(w, http.StatusOK, map[string]any{"categories": items})
}

// ---- /api/market ----

// GetMarketStats returns platform-level aggregated stats
func GetMarketStats(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, models.MarketStats{
		TotalProducts:   "2.4M+",
		TotalRevenue:    "$48.2M",
		KeywordsIndexed: "14.3B",
		ActiveUsers:     "98K+",
	})
}

// GetTrendingProducts returns products sorted by trend percentage (top risers)
func GetTrendingProducts(w http.ResponseWriter, r *http.Request) {
	limit := 10
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 {
			limit = n
		}
	}

	// Collect rising products sorted by trendPct
	rising := make([]models.Product, 0)
	for _, p := range data.Products {
		if p.Trend == "rising" {
			rising = append(rising, p)
		}
	}
	// Simple insertion sort by trendPct descending
	for i := 1; i < len(rising); i++ {
		for j := i; j > 0 && rising[j].TrendPct > rising[j-1].TrendPct; j-- {
			rising[j], rising[j-1] = rising[j-1], rising[j]
		}
	}
	if limit > len(rising) {
		limit = len(rising)
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"total":    len(rising),
		"products": rising[:limit],
	})
}
