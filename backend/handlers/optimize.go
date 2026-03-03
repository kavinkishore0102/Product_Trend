package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"trendspy/backend/data"
	"trendspy/backend/models"
	"unicode"
)

// ---- Request / Response types ----

type OptimizeRequest struct {
	ASIN        string   `json:"asin"`
	Title       string   `json:"title"`
	Bullets     []string `json:"bullets"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
}

type Issue struct {
	Type    string `json:"type"` // "error" | "warning" | "tip"
	Area    string `json:"area"` // "title" | "bullets" | "description" | "keywords"
	Message string `json:"message"`
}

type KeywordHit struct {
	Keyword      string `json:"keyword"`
	SearchVolume int    `json:"search_volume"`
	InTitle      bool   `json:"in_title"`
	InBullets    bool   `json:"in_bullets"`
}

type OptimizeResponse struct {
	OverallScore      int          `json:"overall_score"`
	Grade             string       `json:"grade"`
	TitleScore        int          `json:"title_score"`
	TitleMax          int          `json:"title_max"`
	BulletScore       int          `json:"bullet_score"`
	BulletMax         int          `json:"bullet_max"`
	DescriptionScore  int          `json:"description_score"`
	DescriptionMax    int          `json:"description_max"`
	KeywordScore      int          `json:"keyword_score"`
	KeywordMax        int          `json:"keyword_max"`
	Issues            []Issue      `json:"issues"`
	Suggestions       []string     `json:"suggestions"`
	TopKeywords       []KeywordHit `json:"top_keywords"`
	MissingKeywords   []KeywordHit `json:"missing_keywords"`
	TitleCharCount    int          `json:"title_char_count"`
	BulletCount       int          `json:"bullet_count"`
	DescriptionLength int          `json:"description_length"`
}

// OptimizeListing handles POST /api/optimize/listing
func OptimizeListing(w http.ResponseWriter, r *http.Request) {
	var req OptimizeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.Description = strings.TrimSpace(req.Description)

	clean := make([]string, 0, 5)
	for _, b := range req.Bullets {
		b = strings.TrimSpace(b)
		if b != "" {
			clean = append(clean, b)
		}
	}
	req.Bullets = clean

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}

	resp := analyzeL(req)
	writeJSON(w, http.StatusOK, resp)
}

// ---- Core scoring ----

func analyzeL(req OptimizeRequest) OptimizeResponse {
	resp := OptimizeResponse{
		TitleMax:       30,
		BulletMax:      30,
		DescriptionMax: 20,
		KeywordMax:     20,
	}
	issues := []Issue{}
	suggestions := []string{}

	titleLower := strings.ToLower(req.Title)
	bulletsText := strings.ToLower(strings.Join(req.Bullets, " "))
	allText := titleLower + " " + bulletsText + " " + strings.ToLower(req.Description)

	// -------- TITLE ANALYSIS (30 pts) --------
	tLen := len(req.Title)
	resp.TitleCharCount = tLen
	titleScore := 0

	if tLen >= 80 && tLen <= 200 {
		titleScore += 12
	} else if tLen >= 50 {
		titleScore += 7
		if tLen < 80 {
			issues = append(issues, Issue{"warning", "title", "Title is short (" + itoa(tLen) + " chars). Aim for 80–200 characters for best visibility."})
			suggestions = append(suggestions, "Expand your title to at least 80 characters — include material, colour, size, and use case.")
		} else {
			issues = append(issues, Issue{"warning", "title", "Title is too long (" + itoa(tLen) + " chars). Amazon may truncate above 200 characters."})
			suggestions = append(suggestions, "Shorten your title to under 200 characters — remove redundant words.")
		}
	} else {
		titleScore += 3
		issues = append(issues, Issue{"error", "title", "Title is very short (" + itoa(tLen) + " chars). This will hurt search ranking and click-through rate."})
		suggestions = append(suggestions, "Rewrite your title to be 80–200 chars, including brand, product name, key features, size, and colour.")
	}

	// Contains numbers (size, quantity, etc.)
	if containsDigit(req.Title) {
		titleScore += 5
	} else {
		issues = append(issues, Issue{"tip", "title", "Consider adding numbers (size, quantity, dimensions) to your title for specificity."})
	}

	// Title case or proper capitalisation
	if isProperCase(req.Title) {
		titleScore += 5
	} else {
		issues = append(issues, Issue{"warning", "title", "Use title case (e.g. 'Wireless Earbuds 32GB'). Avoid ALL CAPS."})
		suggestions = append(suggestions, "Rewrite title in proper title case — Amazon guidelines prohibit ALL CAPS or all lowercase.")
	}

	// Contains pipe / separator to structure info
	if strings.Contains(req.Title, "|") || strings.Contains(req.Title, "-") || strings.Contains(req.Title, ",") {
		titleScore += 4
	} else {
		issues = append(issues, Issue{"tip", "title", "Use separators like '|' or ',' to structure title info (Brand | Product | Feature | Size)."})
	}

	// No subjective terms
	subjective := []string{"best", "cheapest", "amazing", "awesome", "top rated", "number one", "#1"}
	for _, s := range subjective {
		if strings.Contains(titleLower, s) {
			issues = append(issues, Issue{"error", "title", "Remove subjective/promotional terms like '" + s + "' from the title — Amazon prohibits these."})
			titleScore -= 4
			break
		}
	}

	titleScore = clamp(titleScore, 0, 30)
	resp.TitleScore = titleScore

	// -------- BULLET ANALYSIS (30 pts) --------
	bulletCount := len(req.Bullets)
	resp.BulletCount = bulletCount
	bulletScore := 0

	if bulletCount >= 5 {
		bulletScore += 15
	} else if bulletCount >= 3 {
		bulletScore += 9
		issues = append(issues, Issue{"warning", "bullets", "You have " + itoa(bulletCount) + " bullet points. Use all 5 for maximum keyword coverage."})
		suggestions = append(suggestions, "Add "+itoa(5-bulletCount)+" more bullet points — cover features, benefits, compatibility, and guarantee.")
	} else if bulletCount > 0 {
		bulletScore += 4
		issues = append(issues, Issue{"error", "bullets", "Only " + itoa(bulletCount) + " bullet point(s). You need 5 bullets to compete."})
		suggestions = append(suggestions, "Write 5 full bullet points — each 100–200 characters, starting with a key benefit in CAPS.")
	} else {
		issues = append(issues, Issue{"error", "bullets", "No bullet points found. This significantly hurts your listing's conversion and ranking."})
		suggestions = append(suggestions, "Add 5 bullet points (each 100–200 characters) highlighting features, benefits, and use cases.")
	}

	// Bullet length check
	longBullets := 0
	for _, b := range req.Bullets {
		if len(b) >= 80 {
			longBullets++
		}
	}
	if bulletCount > 0 {
		if longBullets == bulletCount {
			bulletScore += 10
		} else if longBullets >= bulletCount/2 {
			bulletScore += 5
			issues = append(issues, Issue{"warning", "bullets", "Some bullets are too short. Aim for 100–200 characters per bullet."})
		} else {
			issues = append(issues, Issue{"error", "bullets", "Most bullet points are too short (under 80 chars). Expand each bullet to 100–200 characters."})
		}
	}

	// Bullets start with caps keyword
	capsStart := 0
	for _, b := range req.Bullets {
		words := strings.Fields(b)
		if len(words) > 0 && isAllCaps(words[0]) {
			capsStart++
		}
	}
	if bulletCount > 0 && capsStart >= bulletCount/2 {
		bulletScore += 5
	} else if bulletCount > 0 {
		issues = append(issues, Issue{"tip", "bullets", "Start each bullet with an ALL CAPS keyword (e.g. 'PREMIUM SOUND — your music...'). This improves scannability."})
	}

	bulletScore = clamp(bulletScore, 0, 30)
	resp.BulletScore = bulletScore

	// -------- DESCRIPTION ANALYSIS (20 pts) --------
	descLen := len(req.Description)
	resp.DescriptionLength = descLen
	descScore := 0

	if descLen >= 500 {
		descScore += 12
	} else if descLen >= 200 {
		descScore += 8
		issues = append(issues, Issue{"warning", "description", "Description is " + itoa(descLen) + " characters. Aim for 500+ for better SEO."})
	} else if descLen > 0 {
		descScore += 4
		issues = append(issues, Issue{"error", "description", "Description is very short (" + itoa(descLen) + " chars). Buyers need detailed information to convert."})
		suggestions = append(suggestions, "Expand product description to 500–2000 characters. Include use cases, technical specs, and brand story.")
	} else {
		issues = append(issues, Issue{"error", "description", "No product description. This hurts SEO and buyer trust."})
		suggestions = append(suggestions, "Add a detailed product description (500–2000 characters) with use cases, materials, and warranty info.")
	}

	// HTML formatting check
	if strings.Contains(req.Description, "<br>") || strings.Contains(req.Description, "<p>") || strings.Contains(req.Description, "<b>") {
		descScore += 5
	} else if descLen > 0 {
		descScore += 2
		issues = append(issues, Issue{"tip", "description", "Use basic HTML formatting (<b>, <br>, <ul>) in your description to improve readability."})
	}

	// Keyword in description
	if descLen > 0 && strings.Contains(strings.ToLower(req.Description), strings.ToLower(firstWord(req.Title))) {
		descScore += 3
	}

	descScore = clamp(descScore, 0, 20)
	resp.DescriptionScore = descScore

	// -------- KEYWORD ANALYSIS (20 pts) --------
	cat := strings.ToLower(req.Category)
	relevantKws := getRelevantKeywords(cat, req.Title)

	keywordScore := 0
	topMatches := []KeywordHit{}
	missingKws := []KeywordHit{}

	for _, kw := range relevantKws {
		kwLower := strings.ToLower(kw.Keyword)
		inTitle := strings.Contains(titleLower, kwLower)
		inBullets := strings.Contains(bulletsText, kwLower)

		if inTitle || inBullets {
			topMatches = append(topMatches, KeywordHit{kw.Keyword, kw.SearchVolume, inTitle, inBullets})
			keywordScore += 2
		} else if len(missingKws) < 8 {
			// Check if at least one word matches
			kwWords := strings.Fields(kwLower)
			partialMatch := false
			for _, w := range kwWords {
				if len(w) > 3 && strings.Contains(allText, w) {
					partialMatch = true
					break
				}
			}
			if !partialMatch {
				missingKws = append(missingKws, KeywordHit{kw.Keyword, kw.SearchVolume, false, false})
			}
		}
	}

	if len(topMatches) >= 5 {
		suggestions = append(suggestions, "Great keyword coverage! Consider adding these missing keywords to your backend search terms.")
	} else if len(topMatches) > 0 {
		suggestions = append(suggestions, "Add more high-volume keywords from the 'Missing Keywords' list to your title and bullets.")
	} else {
		issues = append(issues, Issue{"warning", "keywords", "Very few target keywords found in your listing. Add relevant keywords to title and bullets."})
		suggestions = append(suggestions, "Include the top 3–5 missing keywords in your title and first 2 bullet points.")
	}

	keywordScore = clamp(keywordScore, 0, 20)
	resp.KeywordScore = keywordScore
	resp.TopKeywords = topMatches
	resp.MissingKeywords = missingKws

	// -------- OVERALL --------
	overall := titleScore + bulletScore + descScore + keywordScore
	overall = clamp(overall, 0, 100)
	resp.OverallScore = overall
	resp.Grade = gradeFromScore(overall)
	resp.Issues = issues
	resp.Suggestions = suggestions

	return resp
}

// getRelevantKeywords finds seed keywords matching this category/title
func getRelevantKeywords(category, title string) []models.Keyword {
	result := make([]models.Keyword, 0, 20)
	seen := map[string]bool{}
	titleWords := strings.Fields(strings.ToLower(title))

	for _, kw := range data.Keywords {
		kwLower := strings.ToLower(kw.Keyword)
		if seen[kwLower] {
			continue
		}

		// Category match
		catMatch := false
		if category != "" {
			catMatch = strings.Contains(kwLower, category) ||
				strings.Contains(category, strings.Fields(kwLower)[0])
		}

		// Title word match
		titleMatch := false
		for _, tw := range titleWords {
			if len(tw) >= 4 && strings.Contains(kwLower, tw) {
				titleMatch = true
				break
			}
		}

		if catMatch || titleMatch {
			seen[kwLower] = true
			result = append(result, kw)
		}
	}

	// Sort by search volume descending
	for i := 0; i < len(result)-1; i++ {
		for j := i + 1; j < len(result); j++ {
			if result[j].SearchVolume > result[i].SearchVolume {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	if len(result) > 20 {
		return result[:20]
	}
	return result
}

// ---- Helpers ----

func gradeFromScore(s int) string {
	switch {
	case s >= 85:
		return "A"
	case s >= 70:
		return "B"
	case s >= 55:
		return "C"
	case s >= 40:
		return "D"
	default:
		return "F"
	}
}

func clamp(v, min, max int) int {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	buf := make([]byte, 0, 10)
	neg := n < 0
	if neg {
		n = -n
	}
	for n > 0 {
		buf = append([]byte{byte('0' + n%10)}, buf...)
		n /= 10
	}
	if neg {
		buf = append([]byte{'-'}, buf...)
	}
	return string(buf)
}

func containsDigit(s string) bool {
	for _, c := range s {
		if unicode.IsDigit(c) {
			return true
		}
	}
	return false
}

func isProperCase(s string) bool {
	// Check that it's not ALL CAPS and not all lowercase
	hasUpper := false
	hasLower := false
	for _, c := range s {
		if unicode.IsLetter(c) {
			if unicode.IsUpper(c) {
				hasUpper = true
			} else {
				hasLower = true
			}
		}
	}
	return hasUpper && hasLower
}

func isAllCaps(s string) bool {
	if len(s) < 2 {
		return false
	}
	for _, c := range s {
		if unicode.IsLetter(c) && unicode.IsLower(c) {
			return false
		}
	}
	return true
}

func firstWord(s string) string {
	fields := strings.Fields(s)
	if len(fields) == 0 {
		return ""
	}
	return fields[0]
}
