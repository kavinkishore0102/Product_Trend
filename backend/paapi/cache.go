package paapi

import (
	"sync"
	"time"
)

const cacheTTL = 24 * time.Hour

type cacheEntry struct {
	data      ProductData
	expiresAt time.Time
}

// Cache is a thread-safe in-memory store for PA API results.
// Each ASIN is looked up at most once per 24 hours.
var cache = struct {
	mu      sync.RWMutex
	entries map[string]cacheEntry
}{
	entries: make(map[string]cacheEntry),
}

// Get returns cached ProductData for an ASIN, if fresh.
func Get(asin string) (ProductData, bool) {
	cache.mu.RLock()
	defer cache.mu.RUnlock()
	e, ok := cache.entries[asin]
	if !ok || time.Now().After(e.expiresAt) {
		return ProductData{}, false
	}
	return e.data, true
}

// Set stores ProductData for an ASIN with a 24-hour TTL.
func Set(asin string, pd ProductData) {
	cache.mu.Lock()
	defer cache.mu.Unlock()
	cache.entries[asin] = cacheEntry{
		data:      pd,
		expiresAt: time.Now().Add(cacheTTL),
	}
}

// LookupWithCache checks the cache first; calls PA API on miss.
// Returns (data, true) on a successful PA API hit, (empty, false) if unconfigured or error.
func LookupWithCache(cfg Config, ok bool, asin string) (ProductData, bool) {
	// Check cache
	if pd, hit := Get(asin); hit {
		return pd, pd.Found
	}
	// No credentials → nothing to fetch
	if !ok {
		return ProductData{}, false
	}
	// Call PA API
	pd, err := GetItem(cfg, asin)
	if err != nil {
		// Cache the miss so we don't retry immediately
		Set(asin, ProductData{ASIN: asin, Found: false})
		return ProductData{}, false
	}
	Set(asin, pd)
	return pd, pd.Found
}
