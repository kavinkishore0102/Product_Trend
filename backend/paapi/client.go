package paapi

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"
)

// Config holds the PA API credentials loaded from environment variables.
// Set these before starting the server:
//
//	PAAPI_ACCESS_KEY    — your IAM / associate access key
//	PAAPI_SECRET_KEY    — your IAM / associate secret key
//	PAAPI_PARTNER_TAG   — your associate tag  (e.g. yourtag-21)
//	PAAPI_MARKETPLACE   — marketplace host    (default: www.amazon.in)
type Config struct {
	AccessKey   string
	SecretKey   string
	PartnerTag  string
	Marketplace string
	Region      string // derived from marketplace
}

// LoadConfig reads credentials from environment variables.
// Returns (cfg, true) when all required vars are present, (cfg, false) otherwise.
func LoadConfig() (Config, bool) {
	accessKey := os.Getenv("PAAPI_ACCESS_KEY")
	secretKey := os.Getenv("PAAPI_SECRET_KEY")
	partnerTag := os.Getenv("PAAPI_PARTNER_TAG")
	marketplace := os.Getenv("PAAPI_MARKETPLACE")
	if marketplace == "" {
		marketplace = "www.amazon.in"
	}

	region := marketplaceToRegion(marketplace)
	ok := accessKey != "" && secretKey != "" && partnerTag != ""
	return Config{
		AccessKey:   accessKey,
		SecretKey:   secretKey,
		PartnerTag:  partnerTag,
		Marketplace: marketplace,
		Region:      region,
	}, ok
}

func marketplaceToRegion(marketplace string) string {
	switch {
	case strings.Contains(marketplace, ".in"):
		return "eu-west-1" // PA API v5 India uses eu-west-1
	case strings.Contains(marketplace, ".co.uk"):
		return "eu-west-1"
	case strings.Contains(marketplace, ".de"), strings.Contains(marketplace, ".fr"),
		strings.Contains(marketplace, ".it"), strings.Contains(marketplace, ".es"):
		return "eu-west-1"
	case strings.Contains(marketplace, ".co.jp"):
		return "us-west-2"
	default:
		return "us-east-1" // .com
	}
}

// GetItem calls PA API v5 GetItems for a single ASIN and returns normalised ProductData.
func GetItem(cfg Config, asin string) (ProductData, error) {
	asin = strings.ToUpper(strings.TrimSpace(asin))
	endpoint := fmt.Sprintf("https://webservices.%s/paapi5/getitems", cfg.Marketplace)

	reqBody := GetItemsRequest{
		ItemIds:     []string{asin},
		PartnerTag:  cfg.PartnerTag,
		PartnerType: "Associates",
		Marketplace: cfg.Marketplace,
		Resources: []string{
			"ItemInfo.Title",
			"ItemInfo.ByLineInfo",
			"ItemInfo.Classifications",
			"Offers.Listings.Price",
			"Images.Primary.Large",
			"Images.Primary.Medium",
		},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return ProductData{}, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return ProductData{}, fmt.Errorf("create request: %w", err)
	}

	now := time.Now().UTC()
	dateISO := now.Format("20060102T150405Z")
	dateShort := now.Format("20060102")

	req.Header.Set("Content-Type", "application/json; charset=utf-8; type=GetItemsRequest")
	req.Header.Set("Host", fmt.Sprintf("webservices.%s", cfg.Marketplace))
	req.Header.Set("X-Amz-Date", dateISO)
	req.Header.Set("X-Amz-Target", "com.amazon.paapi5.v1.ProductAdvertisingAPIv5.GetItems")

	// Build AWS Signature v4
	sig, authHeader := signRequest(cfg, req, bodyBytes, dateISO, dateShort)
	_ = sig
	req.Header.Set("Authorization", authHeader)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return ProductData{}, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return ProductData{}, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != 200 {
		return ProductData{}, fmt.Errorf("PA API error %d: %s", resp.StatusCode, string(respBytes))
	}

	var paResp GetItemsResponse
	if err := json.Unmarshal(respBytes, &paResp); err != nil {
		return ProductData{}, fmt.Errorf("unmarshal response: %w", err)
	}

	if paResp.ItemsResult == nil || len(paResp.ItemsResult.Items) == 0 {
		return ProductData{ASIN: asin, Found: false}, nil
	}

	return extractProductData(paResp.ItemsResult.Items[0]), nil
}

// extractProductData normalises a PA API Item into our ProductData struct
func extractProductData(item Item) ProductData {
	pd := ProductData{ASIN: item.ASIN, Found: true}

	if item.ItemInfo != nil {
		if item.ItemInfo.Title != nil {
			pd.Title = item.ItemInfo.Title.DisplayValue
		}
		if item.ItemInfo.ByLineInfo != nil {
			if item.ItemInfo.ByLineInfo.Brand != nil {
				pd.Brand = item.ItemInfo.ByLineInfo.Brand.DisplayValue
			} else if item.ItemInfo.ByLineInfo.Manufacturer != nil {
				pd.Brand = item.ItemInfo.ByLineInfo.Manufacturer.DisplayValue
			}
		}
		if item.ItemInfo.Classifications != nil && item.ItemInfo.Classifications.ProductGroup != nil {
			pd.Category = item.ItemInfo.Classifications.ProductGroup.DisplayValue
		}
	}

	if item.Offers != nil && len(item.Offers.Listings) > 0 {
		if item.Offers.Listings[0].Price != nil {
			pd.Price = item.Offers.Listings[0].Price.Amount
			pd.Currency = item.Offers.Listings[0].Price.Currency
		}
	}

	if item.Images != nil && item.Images.Primary != nil {
		if item.Images.Primary.Large != nil {
			pd.ImageURL = item.Images.Primary.Large.URL
		} else if item.Images.Primary.Medium != nil {
			pd.ImageURL = item.Images.Primary.Medium.URL
		}
	}

	return pd
}

// ---- AWS Signature v4 implementation ----

func signRequest(cfg Config, req *http.Request, body []byte, dateISO, dateShort string) (string, string) {
	service := "ProductAdvertisingAPI"
	host := req.Header.Get("Host")

	// 1. Canonical headers (sorted)
	headerNames := []string{"content-type", "host", "x-amz-date", "x-amz-target"}
	sort.Strings(headerNames)

	canonicalHeaders := ""
	for _, h := range headerNames {
		canonicalHeaders += h + ":" + req.Header.Get(textprotoTitle(h)) + "\n"
	}
	signedHeaders := strings.Join(headerNames, ";")

	// 2. Hash of body
	bodyHash := sha256Hex(body)

	// 3. Canonical request
	canonicalReq := strings.Join([]string{
		"POST",
		"/paapi5/getitems",
		"", // query string
		canonicalHeaders,
		signedHeaders,
		bodyHash,
	}, "\n")

	// 4. String to sign
	credScope := dateShort + "/" + cfg.Region + "/" + service + "/aws4_request"
	strToSign := "AWS4-HMAC-SHA256\n" + dateISO + "\n" + credScope + "\n" + sha256Hex([]byte(canonicalReq))

	// 5. Signing key
	kDate := hmacSHA256([]byte("AWS4"+cfg.SecretKey), []byte(dateShort))
	kRegion := hmacSHA256(kDate, []byte(cfg.Region))
	kService := hmacSHA256(kRegion, []byte(service))
	kSigning := hmacSHA256(kService, []byte("aws4_request"))

	// 6. Signature
	signature := hex.EncodeToString(hmacSHA256(kSigning, []byte(strToSign)))

	// 7. Authorization header
	authHeader := fmt.Sprintf(
		"AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		cfg.AccessKey, credScope, signedHeaders, signature,
	)

	_ = host
	return signature, authHeader
}

func sha256Hex(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

func hmacSHA256(key, data []byte) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write(data)
	return mac.Sum(nil)
}

// textprotoTitle converts a lowercase header name to canonical HTTP form
func textprotoTitle(s string) string {
	parts := strings.Split(s, "-")
	for i, p := range parts {
		if len(p) > 0 {
			parts[i] = strings.ToUpper(p[:1]) + p[1:]
		}
	}
	return strings.Join(parts, "-")
}
