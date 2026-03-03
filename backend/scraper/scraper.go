package scraper

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Config holds ScraperAPI credentials.
var Cfg Config
var CfgOK bool

type Config struct {
	APIKey string
}

// Init loads SCRAPER_API_KEY from env.
func Init() {
	key := os.Getenv("SCRAPER_API_KEY")
	Cfg = Config{APIKey: key}
	CfgOK = key != ""
	if CfgOK {
		fmt.Println("[scraper] ScraperAPI configured ✅")
	} else {
		fmt.Println("[scraper] SCRAPER_API_KEY not set — using synthetic data")
	}
}

// ProductData holds real Amazon product info extracted from the page HTML.
type ProductData struct {
	ASIN     string
	Title    string
	Brand    string
	Category string // top-level breadcrumb
	Price    float64
	Currency string
	ImageURL string
	Rating   float64
	Reviews  int
	Found    bool
}

// ---- in-memory cache ----

type cacheEntry struct {
	data      ProductData
	expiresAt time.Time
}

var cache = struct {
	mu      sync.RWMutex
	entries map[string]cacheEntry
}{entries: make(map[string]cacheEntry)}

const cacheTTL = 24 * time.Hour

func cacheGet(asin string) (ProductData, bool) {
	cache.mu.RLock()
	defer cache.mu.RUnlock()
	e, ok := cache.entries[asin]
	if !ok || time.Now().After(e.expiresAt) {
		return ProductData{}, false
	}
	return e.data, true
}

func cacheSet(asin string, pd ProductData) {
	cache.mu.Lock()
	defer cache.mu.Unlock()
	cache.entries[asin] = cacheEntry{data: pd, expiresAt: time.Now().Add(cacheTTL)}
}

// Lookup fetches real product data for an ASIN using ScraperAPI.
// Results are cached for 24 hours.
func Lookup(cfg Config, asin string) (ProductData, error) {
	if pd, ok := cacheGet(asin); ok {
		return pd, nil
	}

	amazonURL := fmt.Sprintf("https://www.amazon.in/dp/%s", asin)
	scraperURL := fmt.Sprintf("https://api.scraperapi.com/?api_key=%s&url=%s&country_code=in",
		cfg.APIKey, url.QueryEscape(amazonURL))

	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("GET", scraperURL, nil)
	if err != nil {
		return ProductData{}, err
	}
	req.Header.Set("User-Agent", "TrendSpy/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return ProductData{}, fmt.Errorf("scraper request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return ProductData{}, fmt.Errorf("read body: %w", err)
	}

	html := string(body)

	// Check we got a real product page
	if strings.Contains(html, "CAPTCHA") || strings.Contains(html, "captcha") {
		return ProductData{ASIN: asin, Found: false}, fmt.Errorf("blocked by CAPTCHA")
	}
	if len(html) < 10000 {
		return ProductData{ASIN: asin, Found: false}, fmt.Errorf("response too short (%d bytes)", len(html))
	}

	pd := parseProduct(html, asin)
	cacheSet(asin, pd)
	return pd, nil
}

// ---- HTML parsing helpers ----

var (
	rTitle   = regexp.MustCompile(`<span id="productTitle"[^>]*>\s*([^<]+?)\s*</span>`)
	rBrand1  = regexp.MustCompile(`<tr[^>]*id="bylineInfo_feature_div"[^>]*>[\s\S]*?<a[^>]*>([^<]+)</a>`)
	rBrand2  = regexp.MustCompile(`(?i)(?:by|brand|visit the)\s+([A-Za-z0-9 &'-]+?)\s+(?:store|brand)?<`)
	rBrand3  = regexp.MustCompile(`id="bylineInfo"[^>]*>[^<]*<[^>]+>([^<]+)<`)
	rPrice1  = regexp.MustCompile(`<span class="a-price-whole">([0-9,]+)</span>`)
	rPrice2  = regexp.MustCompile(`"priceAmount":"?([0-9.]+)`)
	rRating  = regexp.MustCompile(`([0-9.]+) out of 5 stars`)
	rReviews = regexp.MustCompile(`([0-9,]+)\s+(?:ratings?|reviews?)`)
	rImage   = regexp.MustCompile(`"hiRes":"(https://[^"]+)"`)
	rImageFb = regexp.MustCompile(`id="landingImage"[^>]+src="([^"]+)"`)
	rCrumb   = regexp.MustCompile(`class="a-link-normal a-color-tertiary"[^>]*>\s*([^<]+?)\s*</a>`)
)

func parseProduct(html, asin string) ProductData {
	pd := ProductData{ASIN: asin, Currency: "INR"}

	// Title
	if m := rTitle.FindStringSubmatch(html); m != nil {
		pd.Title = cleanText(m[1])
	}

	// Brand — try multiple patterns
	brandPatterns := []*regexp.Regexp{
		regexp.MustCompile(`"brand"\s*:\s*\{\s*"@type"[^}]*"name"\s*:\s*"([^"]+)"`),
		regexp.MustCompile(`Visit the ([A-Za-z0-9 &'.\-]+) Store`),
		regexp.MustCompile(`"brand"\s*:\s*"([^"]+)"`),
	}
	for _, bp := range brandPatterns {
		if m := bp.FindStringSubmatch(html); m != nil {
			b := cleanText(m[1])
			if b != "" && len(b) < 60 {
				pd.Brand = b
				break
			}
		}
	}

	// Price
	if m := rPrice1.FindStringSubmatch(html); m != nil {
		price := strings.ReplaceAll(m[1], ",", "")
		if v, err := strconv.ParseFloat(price, 64); err == nil {
			pd.Price = v
		}
	}
	if pd.Price == 0 {
		if m := rPrice2.FindStringSubmatch(html); m != nil {
			if v, err := strconv.ParseFloat(m[1], 64); err == nil {
				pd.Price = v
			}
		}
	}

	// Rating
	if m := rRating.FindStringSubmatch(html); m != nil {
		if v, err := strconv.ParseFloat(m[1], 64); err == nil {
			pd.Rating = v
		}
	}

	// Review count
	if m := rReviews.FindStringSubmatch(html); m != nil {
		count := strings.ReplaceAll(m[1], ",", "")
		if v, err := strconv.Atoi(count); err == nil {
			pd.Reviews = v
		}
	}

	// Category (first breadcrumb)
	crumbs := rCrumb.FindAllStringSubmatch(html, 3)
	if len(crumbs) > 0 {
		pd.Category = cleanText(crumbs[0][1])
	}

	// Image
	if m := rImage.FindStringSubmatch(html); m != nil {
		pd.ImageURL = m[1]
	} else if m := rImageFb.FindStringSubmatch(html); m != nil {
		pd.ImageURL = m[1]
	}

	pd.Found = pd.Title != ""
	return pd
}

func cleanText(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.ReplaceAll(s, "\t", " ")
	// collapse multiple spaces
	for strings.Contains(s, "  ") {
		s = strings.ReplaceAll(s, "  ", " ")
	}
	return s
}
