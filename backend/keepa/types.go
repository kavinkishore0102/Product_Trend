package keepa

// Keepa API v1 — types for the /product endpoint response
// Docs: https://keepa.com/#!discuss/c/api

// ProductResponse is the top-level response from GET /product
type ProductResponse struct {
	Timestamp          int64     `json:"timestamp"`
	TokensLeft         int       `json:"tokensLeft"`
	RefillIn           int       `json:"refillIn"`
	RefillRate         int       `json:"refillRate"`
	TokensConsumed     int       `json:"tokensConsumed"`
	TokenFlowReduction float64   `json:"tokenFlowReduction"`
	ProcessingTimeInMs int       `json:"processingTimeInMs"`
	Products           []Product `json:"products"`
	Error              *APIError `json:"error"`
}

type APIError struct {
	Type    string `json:"type"`
	Message string `json:"message"`
	Details string `json:"details"`
}

// Product is a single Amazon product from Keepa
type Product struct {
	ProductType  int    `json:"productType"`
	ASIN         string `json:"asin"`
	DomainID     int    `json:"domainId"`
	Title        string `json:"title"`
	Brand        string `json:"brand"`
	Manufacturer string `json:"manufacturer"`
	ImagesCSV    string `json:"imagesCSV"` // comma-separated image IDs

	// Category tree — name, catId
	CategoryTree []CategoryNode `json:"categoryTree"`
	RootCategory int64          `json:"rootCategory"`

	// Stats (present when stats=1 requested)
	Stats *ProductStats `json:"stats"`

	// Raw CSV price arrays — Keepa encodes historical data as int arrays
	// Index meaning: alternating [unix-minutes, price-cents, ...]
	// We decode BSR and NEW price from these
	CSV [][]int `json:"csv"`

	// Current values (sometimes in stats)
	CurrentPrice     int `json:"current_price"` // cents, -1 if OOS
	CurrentSalesRank int `json:"current_salesRank"`

	// Review info
	ReviewCount int     `json:"reviewCount"`
	Rating      float32 `json:"rating"` // e.g. 45 = 4.5 stars

	// Offers
	NumberFBAOffers int `json:"numberOfFBAOffers"`
	NumberNewOffers int `json:"numberNew"`
}

type CategoryNode struct {
	CatID int64  `json:"catId"`
	Name  string `json:"name"`
}

type ProductStats struct {
	Current         []int `json:"current"` // current values for each csv type
	Avg             []int `json:"avg"`     // 90-day average
	Avg30           []int `json:"avg30"`   // 30-day average
	Avg90           []int `json:"avg90"`   // 90-day average
	Avg180          []int `json:"avg180"`  // 180-day average
	AtIntervalStart []int `json:"atIntervalStart"`
	MinPriceType    int   `json:"minPriceType"`
	MaxPriceType    int   `json:"maxPriceType"`
	Min             []int `json:"min"`
	Max             []int `json:"max"`
}

// Keepa CSV indices for product.CSV array
const (
	CSVAmazon      = 0 // Amazon price
	CSVNew         = 1 // New (3rd party) lowest price
	CSVUsed        = 2 // Used lowest price
	CSVSalesRank   = 3 // Sales rank / BSR
	CSVListPrice   = 4 // List price / MRP
	CSVCollectible = 5
	CSVRefurbished = 6
	CSVNewFBA      = 7
	CSVCount       = 18
)

// ProductData is the normalised output used by handlers
type ProductData struct {
	ASIN         string
	Title        string
	Brand        string
	Category     string
	Price        float64 // current price in local currency
	Currency     string
	ImageURL     string
	Rating       float64 // e.g. 4.5
	Reviews      int
	BSR          int // current BSR
	BSRHistory   []BSRPoint
	PriceHistory []PricePoint
	Found        bool
}

type BSRPoint struct {
	Month string
	BSR   int
}

type PricePoint struct {
	Month string
	Price float64
}
