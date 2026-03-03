package keepa

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"os"
	"time"
)

const (
	baseURL     = "https://api.keepa.com"
	domainIndia = 10 // amazon.in
	domainUS    = 1  // amazon.com
)

// keepaEpoch is the Keepa time origin — minutes since this point
var keepaEpoch = time.Date(2011, 1, 1, 0, 0, 0, 0, time.UTC)

// monthLabels used for building time-series output
var monthLabels = []string{"Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"}

// Config holds the Keepa API configuration loaded from env vars.
// Set KEEPA_API_KEY before starting the backend.
type Config struct {
	APIKey string
	Domain int // 10 = amazon.in, 1 = amazon.com
}

// Cfg is the package-level singleton config.
var Cfg Config
var CfgOK bool

// Init loads Keepa credentials from environment variables.
func Init() {
	key := os.Getenv("KEEPA_API_KEY")
	domain := domainIndia // default to India
	Cfg = Config{APIKey: key, Domain: domain}
	CfgOK = key != ""
	if CfgOK {
		fmt.Printf("[keepa] Configured — domain: %d (amazon.in)\n", domain)
	} else {
		fmt.Println("[keepa] Not configured — set KEEPA_API_KEY env var")
	}
}

// GetProduct calls Keepa /product endpoint for a single ASIN.
func GetProduct(cfg Config, asin string) (ProductData, error) {
	params := url.Values{}
	params.Set("key", cfg.APIKey)
	params.Set("domain", fmt.Sprintf("%d", cfg.Domain))
	params.Set("asin", asin)
	params.Set("stats", "1") // include current stats
	params.Set("history", "1")

	reqURL := baseURL + "/product?" + params.Encode()

	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return ProductData{}, err
	}
	req.Header.Set("Accept-Encoding", "gzip")

	resp, err := client.Do(req)
	if err != nil {
		return ProductData{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return ProductData{}, err
	}

	var pr ProductResponse
	if err := json.Unmarshal(body, &pr); err != nil {
		return ProductData{}, fmt.Errorf("unmarshal: %w — body: %s", err, string(body[:min(200, len(body))]))
	}

	if pr.Error != nil {
		return ProductData{}, fmt.Errorf("keepa error: %s — %s", pr.Error.Type, pr.Error.Message)
	}

	if len(pr.Products) == 0 {
		return ProductData{ASIN: asin, Found: false}, nil
	}

	return extractProductData(pr.Products[0], cfg.Domain), nil
}

func extractProductData(p Product, domain int) ProductData {
	pd := ProductData{ASIN: p.ASIN, Found: true}

	pd.Title = p.Title
	pd.Brand = p.Brand
	if pd.Brand == "" {
		pd.Brand = p.Manufacturer
	}

	if len(p.CategoryTree) > 0 {
		pd.Category = p.CategoryTree[0].Name
	}

	// Rating: Keepa returns e.g. 45 for 4.5 stars
	if p.Rating > 0 {
		pd.Rating = float64(p.Rating) / 10.0
	}
	pd.Reviews = p.ReviewCount

	// Currency
	switch domain {
	case domainIndia:
		pd.Currency = "INR"
	default:
		pd.Currency = "USD"
	}

	// Image URL from imagesCSV (first image ID)
	if p.ImagesCSV != "" {
		// Build HTTPS image URL
		// Format: https://images-na.ssl-images-amazon.com/images/I/{id}
		imageID := p.ImagesCSV
		// Take first ID if multiple (comma-separated)
		for i, c := range imageID {
			if c == ',' {
				imageID = imageID[:i]
				break
			}
		}
		if imageID != "" {
			pd.ImageURL = fmt.Sprintf("https://images-na.ssl-images-amazon.com/images/I/%s", imageID)
		}
	}

	// Current price from stats or CSV
	// Keepa prices are in cents (or paise for INR)
	if p.Stats != nil && len(p.Stats.Current) > CSVNew {
		rawPrice := p.Stats.Current[CSVNew]
		if rawPrice > 0 {
			pd.Price = float64(rawPrice) / 100.0
		}
	}
	// Fallback to Amazon price
	if pd.Price == 0 && p.Stats != nil && len(p.Stats.Current) > CSVAmazon {
		rawPrice := p.Stats.Current[CSVAmazon]
		if rawPrice > 0 {
			pd.Price = float64(rawPrice) / 100.0
		}
	}

	// BSR from current stats
	if p.Stats != nil && len(p.Stats.Current) > CSVSalesRank {
		pd.BSR = p.Stats.Current[CSVSalesRank]
	}
	if pd.BSR == 0 {
		pd.BSR = p.CurrentSalesRank
	}

	// Build 12-month BSR history from CSV[3] (SalesRank)
	if len(p.CSV) > CSVSalesRank {
		pd.BSRHistory = decodeBSRHistory(p.CSV[CSVSalesRank])
	}

	// Build 12-month price history from CSV[1] (New price)
	if len(p.CSV) > CSVNew {
		pd.PriceHistory = decodePriceHistory(p.CSV[CSVNew])
	}

	return pd
}

// decodeBSRHistory decodes Keepa's alternating [keepa-time, value, keepa-time, value, ...] int array
// into a 12-month BSR history slice.
func decodeBSRHistory(csv []int) []BSRPoint {
	if len(csv) < 2 {
		return nil
	}
	now := time.Now().UTC()
	cutoff := now.Add(-370 * 24 * time.Hour) // 12+ months back

	// Collect (time, bsr) pairs from the past 12 months
	type sample struct {
		t   time.Time
		bsr int
	}
	samples := make([]sample, 0)
	for i := 0; i+1 < len(csv); i += 2 {
		keepaMin := csv[i]
		bsr := csv[i+1]
		if keepaMin < 0 || bsr <= 0 {
			continue
		}
		t := keepaEpoch.Add(time.Duration(keepaMin) * time.Minute)
		if t.Before(cutoff) {
			continue
		}
		samples = append(samples, sample{t, bsr})
	}

	return buildMonthlyPoints(len(monthLabels), func(monthBack int) int {
		// Find closest sample for each month
		target := now.AddDate(0, -(11 - monthBack), 0)
		best := -1
		bestDiff := math.MaxFloat64
		for _, s := range samples {
			diff := math.Abs(float64(s.t.Unix() - target.Unix()))
			if diff < bestDiff {
				bestDiff = diff
				best = s.bsr
			}
		}
		return best
	})
}

func decodePriceHistory(csv []int) []PricePoint {
	if len(csv) < 2 {
		return nil
	}
	now := time.Now().UTC()
	cutoff := now.Add(-370 * 24 * time.Hour)

	type sample struct {
		t     time.Time
		price int // in paise/cents
	}
	samples := make([]sample, 0)
	for i := 0; i+1 < len(csv); i += 2 {
		keepaMin := csv[i]
		price := csv[i+1]
		if keepaMin < 0 || price <= 0 {
			continue
		}
		t := keepaEpoch.Add(time.Duration(keepaMin) * time.Minute)
		if t.Before(cutoff) {
			continue
		}
		samples = append(samples, sample{t, price})
	}

	pts := make([]PricePoint, len(monthLabels))
	for i := range monthLabels {
		target := now.AddDate(0, -(11 - i), 0)
		bestPrice := -1
		bestDiff := math.MaxFloat64
		for _, s := range samples {
			diff := math.Abs(float64(s.t.Unix() - target.Unix()))
			if diff < bestDiff {
				bestDiff = diff
				bestPrice = s.price
			}
		}
		price := 0.0
		if bestPrice > 0 {
			price = float64(bestPrice) / 100.0
		}
		pts[i] = PricePoint{Month: monthLabels[i], Price: price}
	}
	return pts
}

func buildMonthlyPoints(n int, valueFn func(monthBack int) int) []BSRPoint {
	pts := make([]BSRPoint, n)
	for i := 0; i < n; i++ {
		pts[i] = BSRPoint{Month: monthLabels[i], BSR: valueFn(i)}
	}
	return pts
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
