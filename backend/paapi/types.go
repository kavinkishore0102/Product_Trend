package paapi

// PA API v5 request/response types for the GetItems operation

// Request body sent to PA API
type GetItemsRequest struct {
	ItemIds     []string `json:"ItemIds"`
	Resources   []string `json:"Resources"`
	PartnerTag  string   `json:"PartnerTag"`
	PartnerType string   `json:"PartnerType"`
	Marketplace string   `json:"Marketplace"`
}

// Top-level response from PA API
type GetItemsResponse struct {
	ItemsResult *ItemsResult `json:"ItemsResult,omitempty"`
	Errors      []PAError    `json:"Errors,omitempty"`
}

type PAError struct {
	Code    string `json:"Code"`
	Message string `json:"Message"`
}

type ItemsResult struct {
	Items []Item `json:"Items"`
}

type Item struct {
	ASIN     string    `json:"ASIN"`
	ItemInfo *ItemInfo `json:"ItemInfo,omitempty"`
	Offers   *Offers   `json:"Offers,omitempty"`
	Images   *Images   `json:"Images,omitempty"`
}

// ---------- ItemInfo ----------

type ItemInfo struct {
	Title           *StringValue     `json:"Title,omitempty"`
	ByLineInfo      *ByLineInfo      `json:"ByLineInfo,omitempty"`
	Classifications *Classifications `json:"Classifications,omitempty"`
	ContentRating   *StringValue     `json:"ContentRating,omitempty"`
}

type StringValue struct {
	DisplayValue string `json:"DisplayValue"`
	Label        string `json:"Label,omitempty"`
	Locale       string `json:"Locale,omitempty"`
}

type ByLineInfo struct {
	Brand        *StringValue  `json:"Brand,omitempty"`
	Contributors []Contributor `json:"Contributors,omitempty"`
	Manufacturer *StringValue  `json:"Manufacturer,omitempty"`
}

type Contributor struct {
	Name   StringValue `json:"Name"`
	Locale string      `json:"Locale,omitempty"`
	Role   StringValue `json:"Role"`
}

type Classifications struct {
	ProductGroup *StringValue `json:"ProductGroup,omitempty"`
	Binding      *StringValue `json:"Binding,omitempty"`
}

// ---------- Offers ----------

type Offers struct {
	Listings []Listing `json:"Listings,omitempty"`
}

type Listing struct {
	Price        *Price    `json:"Price,omitempty"`
	SavingBasis  *Price    `json:"SavingBasis,omitempty"`
	MerchantInfo *Merchant `json:"MerchantInfo,omitempty"`
}

type Price struct {
	Amount        float64      `json:"Amount"`
	Currency      string       `json:"Currency"`
	DisplayAmount string       `json:"DisplayAmount"`
	Savings       *PriceSaving `json:"Savings,omitempty"`
}

type PriceSaving struct {
	Amount        float64 `json:"Amount"`
	Currency      string  `json:"Currency"`
	DisplayAmount string  `json:"DisplayAmount"`
	Percentage    float64 `json:"Percentage"`
}

type Merchant struct {
	Name string `json:"Name"`
}

// ---------- Images ----------

type Images struct {
	Primary  *ImageGroup  `json:"Primary,omitempty"`
	Variants []ImageGroup `json:"Variants,omitempty"`
}

type ImageGroup struct {
	Small  *ImageItem `json:"Small,omitempty"`
	Medium *ImageItem `json:"Medium,omitempty"`
	Large  *ImageItem `json:"Large,omitempty"`
}

type ImageItem struct {
	URL    string `json:"URL"`
	Height int    `json:"Height"`
	Width  int    `json:"Width"`
}

// ---------- ProductData — the extracted, normalised form we use in handlers ----------

type ProductData struct {
	ASIN     string
	Title    string
	Brand    string
	Category string
	Price    float64
	Currency string
	ImageURL string
	Found    bool
}
