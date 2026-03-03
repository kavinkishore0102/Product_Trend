package handlers

import (
	"math/rand"
	"net/http"
	"strings"
	"trendspy/backend/data"
	"trendspy/backend/models"
	"trendspy/backend/scraper"
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
// For seed ASINs: uses exact TopASIN/RelatedASINs match.
// For any other ASIN: fetches real product via ScraperAPI then matches/generates relevant keywords.
func GetReverseASIN(w http.ResponseWriter, r *http.Request) {
	asin := strings.ToUpper(r.PathValue("asin"))

	// Resolve real product name, category, image
	var productName, productCategory, productImage string

	if p, ok := data.GetProductByASIN(asin); ok {
		productName = p.Name
		productCategory = p.Category
		productImage = p.Image
	} else {
		gen := data.GenerateProductFromASIN(asin)
		productName = gen.Name
		productCategory = gen.Category
		productImage = gen.Image
	}

	// ---- ScraperAPI: overlay real product data ----
	if scraper.CfgOK {
		if sd, err := scraper.Lookup(scraper.Cfg, asin); err == nil && sd.Found {
			if sd.Title != "" {
				productName = sd.Title
			}
			if sd.Category != "" {
				productCategory = sd.Category
			}
			if sd.ImageURL != "" {
				productImage = sd.ImageURL
			}
		}
	}

	// ---- Match seed keywords against product ----
	result := make([]models.ReverseASINKeyword, 0)

	// Split product title and category into searchable tokens
	titleWords := extractTokens(productName)
	categoryWords := extractTokens(productCategory)

	// First pass: exact TopASIN / RelatedASINs match (for seed products)
	exactMatches := map[string]bool{}
	for _, k := range data.Keywords {
		isTop := k.TopASIN == asin
		isRelated := false
		for _, ra := range k.RelatedASINs {
			if ra == asin {
				isRelated = true
				break
			}
		}
		if !isTop && !isRelated {
			continue
		}
		exactMatches[k.Keyword] = true

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

	// Second pass: keyword title/category matching for unknown ASINs
	if len(result) < 5 {
		for _, k := range data.Keywords {
			if exactMatches[k.Keyword] {
				continue
			}
			kwLower := strings.ToLower(k.Keyword)

			matched := false
			// Match if keyword contains a product title word or category word
			for _, tok := range append(titleWords, categoryWords...) {
				if len(tok) >= 3 && strings.Contains(kwLower, tok) {
					matched = true
					break
				}
			}
			if !matched {
				continue
			}

			// Generate deterministic rank based on ASIN+keyword hash
			seed := int64(asinHash(asin + k.Keyword))
			rng := rand.New(rand.NewSource(seed))
			rank := 3 + rng.Intn(40)
			organicRank := &rank

			var sponsoredRank *int
			if k.Difficulty > 60 && rng.Float32() > 0.5 {
				sr := 1 + rng.Intn(5)
				sponsoredRank = &sr
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
	}

	// Third pass: generate synthetic keywords from product title
	// Always generate and append to pad results to at least 10 keywords
	synthetic := generateKeywordsFromProduct(asin, productName, productCategory)
	for _, sk := range synthetic {
		// Avoid duplicates
		dupe := false
		for _, ex := range result {
			if strings.EqualFold(ex.Keyword, sk.Keyword) {
				dupe = true
				break
			}
		}
		if !dupe {
			result = append(result, sk)
		}
	}

	// Sort by search volume descending (simple bubble for small sets)
	for i := 0; i < len(result)-1; i++ {
		for j := i + 1; j < len(result); j++ {
			if result[j].SearchVolume > result[i].SearchVolume {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"asin":          asin,
		"product":       productName,
		"product_image": productImage,
		"category":      productCategory,
		"total":         len(result),
		"keywords":      result,
	})
}

// extractTokens splits a string into meaningful lowercase tokens (3+ chars)
func extractTokens(s string) []string {
	// Common stopwords to ignore
	stopwords := map[string]bool{
		"the": true, "and": true, "for": true, "with": true, "from": true,
		"has": true, "all": true, "are": true, "was": true,
	}
	words := strings.Fields(strings.ToLower(s))
	tokens := make([]string, 0, len(words))
	for _, w := range words {
		// Strip punctuation
		w = strings.Trim(w, ".,|!?()[]{}\"'")
		if len(w) >= 3 && !stopwords[w] {
			tokens = append(tokens, w)
		}
	}
	return tokens
}

// asinHash generates a stable unsigned int from a string
func asinHash(s string) uint32 {
	var h uint32 = 2166136261
	for _, c := range []byte(s) {
		h ^= uint32(c)
		h *= 16777619
	}
	return h
}

// generateKeywordsFromProduct creates synthetic keywords derived from the product title
func generateKeywordsFromProduct(asin, productName, category string) []models.ReverseASINKeyword {
	tokens := extractTokens(productName)
	catTokens := extractTokens(category)

	// Deduplicate tokens
	seen := map[string]bool{}
	allTokens := append(tokens, catTokens...)
	unique := make([]string, 0)
	for _, t := range allTokens {
		if !seen[t] && len(t) >= 4 {
			seen[t] = true
			unique = append(unique, t)
		}
	}

	// Build keyword phrases
	phrases := make([]string, 0)
	// Single tokens
	for _, t := range unique[:min2(6, len(unique))] {
		phrases = append(phrases, t)
	}
	// Two-word combos
	for i := 0; i+1 < len(unique) && i < 4; i++ {
		phrases = append(phrases, unique[i]+" "+unique[i+1])
	}
	// Category + first noun
	if len(catTokens) > 0 && len(tokens) > 0 {
		phrases = append(phrases, catTokens[0]+" "+tokens[0])
	}

	rng := rand.New(rand.NewSource(int64(asinHash(asin))))
	result := make([]models.ReverseASINKeyword, 0, len(phrases))
	comps := []string{"Low", "Medium", "High"}

	for i, phrase := range phrases {
		vol := 1000 + rng.Intn(80000)
		diff := 20 + rng.Intn(65)
		trend := -15 + rng.Intn(50)
		cpc := 0.30 + rng.Float64()*3.5
		rank := 1 + (i * 3) + rng.Intn(10)
		var sp *int
		if diff > 55 {
			sr := 1 + rng.Intn(4)
			sp = &sr
		}
		result = append(result, models.ReverseASINKeyword{
			Keyword:       phrase,
			SearchVolume:  vol,
			Trend:         float64(trend),
			CPC:           cpc,
			Competition:   comps[rng.Intn(3)],
			Difficulty:    diff,
			OrganicRank:   &rank,
			SponsoredRank: sp,
		})
	}
	return result
}

func min2(a, b int) int {
	if a < b {
		return a
	}
	return b
}
