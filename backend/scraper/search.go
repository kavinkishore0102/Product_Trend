package scraper

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// SearchResult holds a single product result from Amazon search page.
type SearchResult struct {
	ASIN     string
	Title    string
	Price    float64
	Rating   float64
	Reviews  int
	ImageURL string
	Category string
}

// DiscoverFilter holds all user-supplied discovery criteria.
type DiscoverFilter struct {
	Category    string  // e.g. "electronics", "home", "kitchen", "toys"
	PriceMin    float64 // 0 means no lower bound
	PriceMax    float64 // 0 means no upper bound
	Competition string  // "low" | "medium" | "high" | ""
	RevenueMin  float64 // minimum estimated monthly revenue
	Size        string  // "small" | "medium" | "large" | ""
}

// SearchAmazon fetches Amazon search results for a category using ScraperAPI autoparse.
func SearchAmazon(cfg Config, filter DiscoverFilter) ([]SearchResult, error) {
	searchQuery := categoryToSearchQuery(filter.Category)

	amazonURL := fmt.Sprintf(
		"https://www.amazon.in/s?k=%s",
		url.QueryEscape(searchQuery),
	)

	// Use autoparse=true to get structured JSON product data
	scraperURL := fmt.Sprintf(
		"https://api.scraperapi.com/?api_key=%s&url=%s&country_code=in&autoparse=true",
		cfg.APIKey,
		url.QueryEscape(amazonURL),
	)

	client := &http.Client{Timeout: 45 * time.Second}
	req, _ := http.NewRequest("GET", scraperURL, nil)
	req.Header.Set("User-Agent", "TrendSpy/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("search request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read body: %w", err)
	}

	// Try autoparse JSON first
	results, err := parseAutoparsedJSON(body, filter)
	if err == nil && len(results) > 0 {
		return results, nil
	}

	// Fallback: parse HTML manually
	html := string(body)
	if len(html) < 5000 {
		return nil, fmt.Errorf("response too short: %d bytes", len(html))
	}
	return parseSearchHTML(html, filter), nil
}

// ---- Autoparse response (ScraperAPI structured JSON) ----

type autoparsedResp struct {
	Results []autoparsedProduct `json:"results"`
}

type autoparsedProduct struct {
	Type         string  `json:"type"`
	ASIN         string  `json:"asin"`
	Name         string  `json:"name"`
	Image        string  `json:"image"`
	URL          string  `json:"url"`
	Stars        float64 `json:"stars"`
	TotalReviews int     `json:"total_reviews"`
	Price        float64 `json:"price"`
	IsBestSeller bool    `json:"is_best_seller"`
	IsChoice     bool    `json:"is_amazon_choice"`
}

func parseAutoparsedJSON(body []byte, filter DiscoverFilter) ([]SearchResult, error) {
	var ap autoparsedResp
	if err := json.Unmarshal(body, &ap); err != nil {
		return nil, err
	}
	if len(ap.Results) == 0 {
		return nil, fmt.Errorf("no results in autoparse response")
	}

	results := make([]SearchResult, 0, len(ap.Results))
	for _, p := range ap.Results {
		// Only include actual product listings
		if p.Type != "" && p.Type != "search_product" {
			continue
		}
		if p.ASIN == "" || p.Name == "" {
			continue
		}
		sr := SearchResult{
			ASIN:     p.ASIN,
			Title:    cleanText(p.Name),
			ImageURL: p.Image,
			Category: filter.Category,
			Price:    p.Price,
			Rating:   p.Stars,
			Reviews:  p.TotalReviews,
		}
		results = append(results, sr)
	}
	return results, nil
}

// ---- HTML fallback parser ----

var (
	rPriceRupee    = regexp.MustCompile(`(?:₹|&#x20B9;|\\u20b9)\s*([0-9,]+)`)
	rSearchRating  = regexp.MustCompile(`([0-9.]+) out of 5`)
	rSearchReviews = regexp.MustCompile(`\(([0-9,]+)\)`)
	rSearchImage   = regexp.MustCompile(`s-image"[^>]+src="([^"]+)"`)
	rSearchASINs   = regexp.MustCompile(`data-asin="([A-Z0-9]{10})"`)
	rH2Title       = regexp.MustCompile(`<h2[^>]*>[\s\S]{0,200}?<span[^>]*>([^<]{10,300})</span>`)
	rAriaLabel     = regexp.MustCompile(`aria-label="([^"]{10,})"`)
)

func parseSearchHTML(html string, filter DiscoverFilter) []SearchResult {
	// Find all s-search-result block boundaries
	blockBoundaryRe := regexp.MustCompile(`data-component-type="s-search-result"`)
	boundaries := blockBoundaryRe.FindAllStringIndex(html, 50)

	results := make([]SearchResult, 0, 30)
	seen := map[string]bool{}

	for i, bnd := range boundaries {
		// Slice the block from this boundary to the next (or +5000 chars)
		start := bnd[0]
		end := start + 5000
		if i+1 < len(boundaries) && boundaries[i+1][0] < end {
			end = boundaries[i+1][0]
		}
		if end > len(html) {
			end = len(html)
		}
		block := html[start:end]

		// ASIN
		asinMatches := rSearchASINs.FindStringSubmatch(block)
		if asinMatches == nil {
			continue
		}
		asin := asinMatches[1]
		if seen[asin] {
			continue
		}
		seen[asin] = true

		sr := SearchResult{ASIN: asin, Category: filter.Category}

		// Title — try h2 first, then aria-label
		if m := rH2Title.FindStringSubmatch(block); m != nil {
			sr.Title = cleanText(m[1])
		}
		if sr.Title == "" || strings.HasPrefix(strings.ToLower(sr.Title), "best seller") {
			// try aria-label
			for _, m := range rAriaLabel.FindAllStringSubmatch(block, 10) {
				t := cleanText(m[1])
				if len(t) > 15 && !strings.Contains(strings.ToLower(t), "best seller") && !strings.Contains(strings.ToLower(t), "overall pick") {
					sr.Title = t
					break
				}
			}
		}

		// Price
		if m := rPriceRupee.FindStringSubmatch(block); m != nil {
			p := strings.ReplaceAll(m[1], ",", "")
			if v, err := strconv.ParseFloat(p, 64); err == nil {
				sr.Price = v
			}
		}

		// Rating
		if m := rSearchRating.FindStringSubmatch(block); m != nil {
			if v, err := strconv.ParseFloat(m[1], 64); err == nil {
				sr.Rating = v
			}
		}

		// Reviews
		if m := rSearchReviews.FindStringSubmatch(block); m != nil {
			r := strings.ReplaceAll(m[1], ",", "")
			if v, err := strconv.Atoi(r); err == nil {
				sr.Reviews = v
			}
		}

		// Image
		if m := rSearchImage.FindStringSubmatch(block); m != nil {
			sr.ImageURL = m[1]
		}

		if sr.Title == "" {
			continue
		}
		results = append(results, sr)
	}
	return results
}

// categoryToSearchQuery maps UI categories to Amazon search terms.
func categoryToSearchQuery(cat string) string {
	m := map[string]string{
		"electronics": "electronics gadgets best sellers",
		"home":        "home appliances best sellers",
		"kitchen":     "kitchen products best sellers india",
		"toys":        "toys for kids best sellers india",
		"sports":      "sports fitness equipment india",
		"fashion":     "clothing accessories india",
		"beauty":      "beauty personal care india",
		"books":       "books bestsellers india",
		"automotive":  "car accessories india",
		"garden":      "garden outdoor india",
		"baby":        "baby products india",
		"health":      "health wellness products india",
		"office":      "office supplies india",
		"pet":         "pet supplies india",
		"grocery":     "grocery food india",
	}
	if v, ok := m[strings.ToLower(cat)]; ok {
		return v
	}
	return cat + " best sellers india"
}

// ScoreAndFilter applies the user's filters and scores each product.
func ScoreAndFilter(results []SearchResult, filter DiscoverFilter) []ScoredProduct {
	scored := make([]ScoredProduct, 0, len(results))

	for _, r := range results {
		score, reasons := scoreProduct(r, filter)
		if score < 0 {
			continue
		}
		scored = append(scored, ScoredProduct{
			SearchResult:      r,
			DiscoveryScore:    score,
			Reasons:           reasons,
			EstMonthlyRevenue: estimateRevenue(r),
			EstMonthlySales:   estimateSales(r),
			CompetitionLevel:  competitionLevel(r.Reviews),
			SizeEstimate:      estimateSize(r.Title),
		})
	}

	// Sort by score descending
	for i := 0; i < len(scored)-1; i++ {
		for j := i + 1; j < len(scored); j++ {
			if scored[j].DiscoveryScore > scored[i].DiscoveryScore {
				scored[i], scored[j] = scored[j], scored[i]
			}
		}
	}

	if len(scored) > 25 {
		return scored[:25]
	}
	return scored
}

// ScoredProduct is a SearchResult enriched with scores and estimates.
type ScoredProduct struct {
	SearchResult
	DiscoveryScore    int
	Reasons           []string
	EstMonthlyRevenue float64
	EstMonthlySales   int
	CompetitionLevel  string
	SizeEstimate      string
}

func scoreProduct(r SearchResult, f DiscoverFilter) (int, []string) {
	score := 50
	reasons := []string{}

	// ---- Price filter ----
	if f.PriceMin > 0 && r.Price > 0 && r.Price < f.PriceMin {
		return -1, nil
	}
	if f.PriceMax > 0 && r.Price > f.PriceMax {
		return -1, nil
	}
	if r.Price > 0 && r.Price < 1000 {
		score += 10
		reasons = append(reasons, "Low entry cost")
	} else if r.Price >= 1000 && r.Price <= 5000 {
		score += 5
		reasons = append(reasons, "Mid-range price")
	}

	// ---- Competition filter ----
	comp := competitionLevel(r.Reviews)
	if f.Competition != "" && !strings.EqualFold(comp, f.Competition) {
		return -1, nil
	}
	switch comp {
	case "Low":
		score += 20
		reasons = append(reasons, "Low competition 🔥")
	case "Medium":
		score += 10
		reasons = append(reasons, "Medium competition")
	case "High":
		score -= 5
	}

	// ---- Revenue filter ----
	rev := estimateRevenue(r)
	if f.RevenueMin > 0 && rev < f.RevenueMin {
		return -1, nil
	}
	if rev > 100000 {
		score += 15
		reasons = append(reasons, "High revenue potential")
	} else if rev > 30000 {
		score += 8
		reasons = append(reasons, "Good revenue potential")
	}

	// ---- Size filter ----
	if f.Size != "" && !strings.EqualFold(estimateSize(r.Title), f.Size) {
		return -1, nil
	}

	// ---- Rating bonus ----
	if r.Rating >= 4.5 {
		score += 10
		reasons = append(reasons, "Highly rated ⭐")
	} else if r.Rating >= 4.0 {
		score += 5
	}

	// ---- Reviews bonus ----
	if r.Reviews > 200 && r.Reviews < 5000 {
		score += 8
		reasons = append(reasons, "Proven demand")
	}

	return score, reasons
}

func estimateRevenue(r SearchResult) float64 {
	return r.Price * float64(estimateSales(r))
}

func estimateSales(r SearchResult) int {
	if r.Reviews == 0 {
		return 50
	}
	est := r.Reviews * 8
	if r.Rating >= 4.5 {
		est = int(float64(est) * 1.3)
	}
	if est > 50000 {
		est = 50000
	}
	return est
}

func competitionLevel(reviews int) string {
	if reviews < 500 {
		return "Low"
	} else if reviews < 5000 {
		return "Medium"
	}
	return "High"
}

func estimateSize(title string) string {
	lower := strings.ToLower(title)
	largeKw := []string{"sofa", "bed", "wardrobe", "refrigerator", "washing machine", "tv ", "television", "treadmill", "chair", "table", "furniture", "mattress"}
	smallKw := []string{"cable", "pen", "card", "key ", "earring", "ring ", "tag", "clip", "sticker", "badge", "mini", "micro", "nano", "small", "earphone", "earbud"}
	for _, kw := range largeKw {
		if strings.Contains(lower, kw) {
			return "Large"
		}
	}
	for _, kw := range smallKw {
		if strings.Contains(lower, kw) {
			return "Small"
		}
	}
	return "Medium"
}
