package handlers

import (
	"net/http"
	"strings"
	"sync"
	"time"
	"trendspy/backend/scraper"
)

// TrackerSnapshot is a point-in-time data capture for one ASIN.
type TrackerSnapshot struct {
	ASIN      string    `json:"asin"`
	Title     string    `json:"title"`
	Brand     string    `json:"brand"`
	Category  string    `json:"category"`
	Price     float64   `json:"price"`
	Rating    float64   `json:"rating"`
	Reviews   int       `json:"reviews"`
	ImageURL  string    `json:"image_url"`
	Found     bool      `json:"found"`
	Error     string    `json:"error,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// CompareASINs handles GET /api/track/compare?asins=B01,B02,B03
// Fetches up to 5 ASINs in parallel and returns current snapshots.
func CompareASINs(w http.ResponseWriter, r *http.Request) {
	if !scraper.CfgOK {
		writeError(w, http.StatusServiceUnavailable, "ScraperAPI not configured — set SCRAPER_API_KEY")
		return
	}

	raw := strings.TrimSpace(r.URL.Query().Get("asins"))
	if raw == "" {
		writeError(w, http.StatusBadRequest, "asins query parameter required (comma-separated, max 5)")
		return
	}

	parts := strings.Split(raw, ",")
	if len(parts) > 5 {
		parts = parts[:5] // cap at 5
	}

	// Deduplicate and sanitise
	seen := map[string]bool{}
	asins := make([]string, 0, 5)
	for _, a := range parts {
		a = strings.TrimSpace(strings.ToUpper(a))
		if a != "" && !seen[a] {
			seen[a] = true
			asins = append(asins, a)
		}
	}

	// Fetch all ASINs in parallel
	results := make([]TrackerSnapshot, len(asins))
	var wg sync.WaitGroup
	for i, asin := range asins {
		wg.Add(1)
		go func(idx int, asin string) {
			defer wg.Done()
			pd, err := scraper.Lookup(scraper.Cfg, asin)
			snap := TrackerSnapshot{
				ASIN:      asin,
				Found:     pd.Found,
				Timestamp: time.Now().UTC(),
			}
			if err != nil {
				snap.Error = err.Error()
			} else {
				snap.Title = pd.Title
				snap.Brand = pd.Brand
				snap.Category = pd.Category
				snap.Price = pd.Price
				snap.Rating = pd.Rating
				snap.Reviews = pd.Reviews
				snap.ImageURL = pd.ImageURL
			}
			results[idx] = snap
		}(i, asin)
	}
	wg.Wait()

	writeJSON(w, http.StatusOK, map[string]any{
		"snapshots":  results,
		"fetched_at": time.Now().UTC().Format(time.RFC3339),
		"count":      len(results),
	})
}
