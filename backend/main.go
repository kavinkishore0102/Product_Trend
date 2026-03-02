package main

import (
	"fmt"
	"log"
	"net/http"
	"trendspy/backend/handlers"
	"trendspy/backend/paapi"
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
	// Initialise Amazon PA API credentials from environment variables
	paapi.Init()
	if paapi.CfgOK {
		log.Printf("✅ Amazon PA API configured — marketplace: %s, partner: %s",
			paapi.Cfg.Marketplace, paapi.Cfg.PartnerTag)
	} else {
		log.Printf("⚠️  Amazon PA API not configured — running in synthetic-data mode.")
		log.Printf("   To enable real product data, set these env vars before starting:")
		log.Printf("     PAAPI_ACCESS_KEY   — your associate access key")
		log.Printf("     PAAPI_SECRET_KEY   — your associate secret key")
		log.Printf("     PAAPI_PARTNER_TAG  — your associate tag (e.g. yourtag-21)")
		log.Printf("     PAAPI_MARKETPLACE  — marketplace host (default: www.amazon.in)")
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

	// ---- Health check ----
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		paStatus := "unconfigured"
		if paapi.CfgOK {
			paStatus = "active"
		}
		fmt.Fprintf(w, `{"status":"ok","service":"TrendSpy API","version":"1.0.0","pa_api":"%s"}`, paStatus)
	})

	addr := ":8080"
	handler := corsMiddleware(mux)

	log.Printf("🚀 TrendSpy API server starting on http://localhost%s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
