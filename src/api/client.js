// API client — all requests go to the Go backend at :8080

const BASE = 'http://localhost:8080/api';

async function apiFetch(path, params = {}) {
    const url = new URL(BASE + path);
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

// Products
export const api = {
    // GET /api/products — list all products, optionally filter by category
    getProducts: (category = '') => apiFetch('/products', { category }),

    // GET /api/products/search?q=...&category=...
    searchProducts: (q = '', category = '') => apiFetch('/products/search', { q, category }),

    // GET /api/products/trending?limit=...
    getTrending: (limit = 10) => apiFetch('/products/trending', { limit }),

    // GET /api/products/:asin
    getProduct: (asin) => apiFetch(`/products/${asin}`),

    // GET /api/products/:asin/history
    getProductHistory: (asin) => apiFetch(`/products/${asin}/history`),

    // GET /api/categories
    getCategories: () => apiFetch('/categories'),

    // GET /api/market/stats
    getMarketStats: () => apiFetch('/market/stats'),

    // GET /api/keywords?q=...
    searchKeywords: (q = '') => apiFetch('/keywords', { q }),

    // GET /api/keywords/:asin/reverse
    getReverseASIN: (asin) => apiFetch(`/keywords/${asin}/reverse`),

    // GET /api/discover?category=&price_min=&price_max=&competition=&revenue_min=&size=
    discoverProducts: (params) => apiFetch('/discover', params),

    // GET /api/health
    health: () => apiFetch('/health'),
};

// Formatting helpers (shared, no dependency on mock data)
export function formatNumber(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n?.toString() ?? '0';
}

export function formatCurrency(n) {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
    return '$' + (n ?? 0).toFixed(2);
}
