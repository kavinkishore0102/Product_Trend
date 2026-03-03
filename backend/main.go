package main

import (
	"fmt"
	"log"
	"net/http"
	"trendspy/backend/handlers"
	"trendspy/backend/keepa"
	"trendspy/backend/paapi"
	"trendspy/backend/scraper"
)

// corsMiddleware adds CORS headers to allow the Vite frontend to call the API
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	// Initialise data sources
	paapi.Init()
	keepa.Init()
	scraper.Init()
	switch {
	case scraper.CfgOK:
		log.Printf("✅ ScraperAPI configured — real Amazon product data enabled")
	case keepa.CfgOK:
		log.Printf("✅ Keepa API configured — real Amazon data enabled")
	case paapi.CfgOK:
		log.Printf("✅ Amazon PA API configured — real product metadata enabled")
	default:
		log.Printf("⚠️  No real data source — set SCRAPER_API_KEY to enable real data")
	}

	mux := http.NewServeMux()

	// ---- Product routes ----
	mux.HandleFunc("GET /api/products", handlers.GetProducts)
	mux.HandleFunc("GET /api/products/search", handlers.SearchProducts)
	mux.HandleFunc("GET /api/products/trending", handlers.GetTrendingProducts)
	mux.HandleFunc("GET /api/products/{asin}", handlers.GetProductByASIN)
	mux.HandleFunc("GET /api/products/{asin}/history", handlers.GetProductHistory)

	// ---- Category routes ----
	mux.HandleFunc("GET /api/categories", handlers.GetCategories)

	// ---- Market routes ----
	mux.HandleFunc("GET /api/market/stats", handlers.GetMarketStats)

	// ---- Keyword routes ----
	mux.HandleFunc("GET /api/keywords", handlers.SearchKeywords)
	mux.HandleFunc("GET /api/keywords/{asin}/reverse", handlers.GetReverseASIN)

	// ---- Product Discovery (smart filter + ScraperAPI) ----
	mux.HandleFunc("GET /api/discover", handlers.DiscoverProducts)

	// ---- Listing Optimizer ----
	mux.HandleFunc("POST /api/optimize/listing", handlers.OptimizeListing)

	// ---- Market Tracker ----
	mux.HandleFunc("GET /api/track/compare", handlers.CompareASINs)

	// ---- Health check ----
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		dataSource := "synthetic"
		switch {
		case scraper.CfgOK:
			dataSource = "scraperapi"
		case keepa.CfgOK:
			dataSource = "keepa"
		case paapi.CfgOK:
			dataSource = "paapi"
		}
		fmt.Fprintf(w, `{"status":"ok","service":"TrendSpy API","version":"1.0.0","data_source":"%s"}`, dataSource)
	})

	addr := ":8080"
	handler := corsMiddleware(mux)

	log.Printf("🚀 TrendSpy API server starting on http://localhost%s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
