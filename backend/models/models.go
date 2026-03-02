package models

// Product represents a single Amazon product
type Product struct {
	ASIN           string   `json:"asin"`
	Name           string   `json:"name"`
	Image          string   `json:"image"`
	Category       string   `json:"category"`
	SubCategory    string   `json:"subcategory"`
	Brand          string   `json:"brand"`
	Price          float64  `json:"price"`
	BSR            int      `json:"bsr"`
	BSRCategory    string   `json:"bsr_category"`
	MonthlySales   int      `json:"monthly_sales"`
	MonthlyRevenue float64  `json:"monthly_revenue"`
	Reviews        int      `json:"reviews"`
	Rating         float64  `json:"rating"`
	SellerCount    int      `json:"seller_count"`
	Trend          string   `json:"trend"`   // "rising", "declining", "stable"
	TrendPct       float64  `json:"trend_pct"`
	LaunchDate     string   `json:"launch_date"`
	ProductScore   int      `json:"product_score"`
	Tags           []string `json:"tags"`
}

// HistoryPoint represents a single data point in time-series history
type HistoryPoint struct {
	Month   string  `json:"month"`
	BSR     int     `json:"bsr,omitempty"`
	Price   float64 `json:"price,omitempty"`
	Sales   int     `json:"sales,omitempty"`
	Revenue float64 `json:"revenue,omitempty"`
	Reviews int     `json:"reviews,omitempty"`
}

// ProductHistory holds all historical data for a product
type ProductHistory struct {
	ASIN   string         `json:"asin"`
	BSR    []HistoryPoint `json:"bsr_history"`
	Price  []HistoryPoint `json:"price_history"`
	Sales  []HistoryPoint `json:"sales_history"`
}

// Keyword represents keyword research data
type Keyword struct {
	Keyword      string   `json:"keyword"`
	SearchVolume int      `json:"search_volume"`
	Trend        float64  `json:"trend"` // month-over-month %
	CPC          float64  `json:"cpc"`
	Competition  string   `json:"competition"` // Low, Medium, High
	Difficulty   int      `json:"difficulty"`  // 0–100
	TopASIN      string   `json:"top_asin"`
	RelatedASINs []string `json:"related_asins"`
}

// ReverseASINKeyword is a keyword tied to organic/sponsored rank
type ReverseASINKeyword struct {
	Keyword      string  `json:"keyword"`
	SearchVolume int     `json:"search_volume"`
	Trend        float64 `json:"trend"`
	CPC          float64 `json:"cpc"`
	Competition  string  `json:"competition"`
	Difficulty   int     `json:"difficulty"`
	OrganicRank  *int    `json:"organic_rank"`
	SponsoredRank *int   `json:"sponsored_rank"`
}

// MarketStats aggregates high-level market overview numbers
type MarketStats struct {
	TotalProducts   string `json:"total_products"`
	TotalRevenue    string `json:"total_revenue"`
	KeywordsIndexed string `json:"keywords_indexed"`
	ActiveUsers     string `json:"active_users"`
}

// SearchResult packages product search results with metadata
type SearchResult struct {
	Query    string    `json:"query"`
	Total    int       `json:"total"`
	Products []Product `json:"products"`
}
