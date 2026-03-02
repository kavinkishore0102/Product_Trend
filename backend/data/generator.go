package data

import (
	"fmt"
	"math/rand"
	"trendspy/backend/models"
)

// categories and themes to pick from deterministically
var genericCategories = []string{"Electronics", "Home & Kitchen", "Sports & Outdoors", "Beauty", "Office Products", "Pet Supplies", "Toys & Games", "Books"}
var genericBrands = []string{"TechPro", "EcoLine", "SmartHome", "PureCraft", "NovaBrand", "ZenLife", "SwiftGear", "PrimeTech", "ClearView", "FlexStyle"}
var genericImages = []string{"📦", "🛍️", "🔧", "💡", "🎯", "⚡", "🌟", "🔑", "💎", "🚀"}
var genericTrends = []string{"rising", "stable", "declining"}
var genericTags = [][]string{
	{"general", "bestseller"},
	{"popular", "trending"},
	{"everyday", "quality"},
	{"premium", "durable"},
	{"value", "affordable"},
}

// asinHash produces a stable hash value from an ASIN string
func asinHash(asin string) int64 {
	var h int64 = 5381
	for _, c := range asin {
		h = h*33 + int64(c)
	}
	if h < 0 {
		h = -h
	}
	return h
}

// GenerateProductFromASIN creates a deterministic synthetic product for any ASIN.
// The same ASIN always returns the same data across requests.
func GenerateProductFromASIN(asin string) models.Product {
	h := asinHash(asin)
	rng := rand.New(rand.NewSource(h))

	cat := genericCategories[rng.Intn(len(genericCategories))]
	brand := genericBrands[rng.Intn(len(genericBrands))]
	image := genericImages[rng.Intn(len(genericImages))]
	trendIdx := rng.Intn(len(genericTrends))
	trend := genericTrends[trendIdx]

	trendPct := 0
	switch trend {
	case "rising":
		trendPct = 5 + rng.Intn(60)
	case "declining":
		trendPct = -(5 + rng.Intn(30))
	default:
		trendPct = rng.Intn(10) - 5
	}

	price := float64(9+rng.Intn(240)) + float64(rng.Intn(99))/100
	bsr := 50 + rng.Intn(1500)
	monthlySales := 500 + rng.Intn(12000)
	monthlyRevenue := float64(monthlySales) * price
	reviews := 100 + rng.Intn(25000)
	rating := 3.5 + float64(rng.Intn(16))/10.0 // 3.5-5.0
	sellerCount := 1 + rng.Intn(14)
	productScore := 50 + rng.Intn(45)

	if trendPct > 0 {
		productScore += trendPct / 5
	}
	if productScore > 99 {
		productScore = 99
	}

	name := fmt.Sprintf("%s %s Product — %s", brand, cat, asin[:4])

	return models.Product{
		ASIN:           asin,
		Name:           name,
		Image:          image,
		Category:       cat,
		SubCategory:    "General",
		Brand:          brand,
		Price:          price,
		BSR:            bsr,
		BSRCategory:    cat + " > General",
		MonthlySales:   monthlySales,
		MonthlyRevenue: monthlyRevenue,
		Reviews:        reviews,
		Rating:         rating,
		SellerCount:    sellerCount,
		Trend:          trend,
		TrendPct:       float64(trendPct),
		LaunchDate:     "2022-01",
		ProductScore:   productScore,
		Tags:           genericTags[rng.Intn(len(genericTags))],
	}
}
