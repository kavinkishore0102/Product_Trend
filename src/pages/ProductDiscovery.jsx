import { useState } from 'react';
import {
    Search, Filter, TrendingUp, TrendingDown, Star, Package,
    DollarSign, Users, Zap, BarChart2, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { api, formatNumber, formatCurrency } from '../api/client';

// ---- Constants ----
const CATEGORIES = [
    { value: 'electronics', label: '📱 Electronics' },
    { value: 'home', label: '🏠 Home Appliances' },
    { value: 'kitchen', label: '🍳 Kitchen' },
    { value: 'toys', label: '🧸 Toys & Games' },
    { value: 'sports', label: '🏋️ Sports & Fitness' },
    { value: 'fashion', label: '👗 Fashion' },
    { value: 'beauty', label: '💄 Beauty & Care' },
    { value: 'baby', label: '👶 Baby Products' },
    { value: 'health', label: '💊 Health & Wellness' },
    { value: 'automotive', label: '🚗 Automotive' },
    { value: 'garden', label: '🌿 Garden & Outdoor' },
    { value: 'pet', label: '🐾 Pet Supplies' },
    { value: 'office', label: '🖊️ Office Supplies' },
];

const PRICE_RANGES = [
    { label: 'Any Price', min: 0, max: 0 },
    { label: 'Under ₹500', min: 0, max: 500 },
    { label: '₹500 – ₹1,000', min: 500, max: 1000 },
    { label: '₹1,000 – ₹3,000', min: 1000, max: 3000 },
    { label: '₹3,000 – ₹10,000', min: 3000, max: 10000 },
    { label: 'Above ₹10,000', min: 10000, max: 0 },
];

const COMPETITION_LEVELS = [
    { value: '', label: 'Any' },
    { value: 'low', label: '🟢 Low' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'high', label: '🔴 High' },
];

const SIZE_OPTIONS = [
    { value: '', label: 'Any Size' },
    { value: 'Small', label: '📦 Small' },
    { value: 'Medium', label: '📦 Medium' },
    { value: 'Large', label: '📦 Large' },
];

const REVENUE_OPTIONS = [
    { value: 0, label: 'Any Revenue' },
    { value: 10000, label: '₹10K+/month' },
    { value: 50000, label: '₹50K+/month' },
    { value: 100000, label: '₹1L+/month' },
    { value: 500000, label: '₹5L+/month' },
];

const scoreColor = (score) => {
    if (score >= 75) return '#10b981';
    if (score >= 55) return '#f59e0b';
    return '#ef4444';
};

const scoreLabel = (score) => {
    if (score >= 75) return 'Excellent';
    if (score >= 55) return 'Good';
    return 'Risky';
};

const compColor = (level) => {
    if (level === 'Low') return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' };
    if (level === 'Medium') return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
    return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' };
};

// ---- Component ----
export default function ProductDiscovery() {
    const [category, setCategory] = useState('electronics');
    const [priceRange, setPriceRange] = useState(0); // index into PRICE_RANGES
    const [competition, setCompetition] = useState('');
    const [size, setSize] = useState('');
    const [revenueMin, setRevenueMin] = useState(0);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);
    const [expandedIdx, setExpandedIdx] = useState(null);

    const handleDiscover = async () => {
        setLoading(true);
        setError('');
        setProducts([]);
        try {
            const range = PRICE_RANGES[priceRange];
            const data = await api.discoverProducts({
                category,
                price_min: range.min || '',
                price_max: range.max || '',
                competition,
                revenue_min: revenueMin || '',
                size,
            });
            setProducts(data.products || []);
            setSearched(true);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <h1>🔍 Product Discovery <span style={{ fontSize: '1rem', fontWeight: 400 }}>— Smart Finder</span></h1>
                <p>Enter your requirements → get the top 25 products that match your opportunity criteria</p>
            </div>

            {/* Filter Card */}
            <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                    <Filter size={18} color="#7c3aed" />
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>Set Your Criteria</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>— tell us what you want, we find it</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 18 }}>
                    {/* Category */}
                    <FilterField label="Product Category" icon={<Package size={14} />}>
                        <select
                            className="input-field"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            style={{ paddingLeft: 14 }}
                        >
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </FilterField>

                    {/* Price Range */}
                    <FilterField label="Price Range" icon={<DollarSign size={14} />}>
                        <select
                            className="input-field"
                            value={priceRange}
                            onChange={e => setPriceRange(Number(e.target.value))}
                            style={{ paddingLeft: 14 }}
                        >
                            {PRICE_RANGES.map((r, i) => (
                                <option key={i} value={i}>{r.label}</option>
                            ))}
                        </select>
                    </FilterField>

                    {/* Competition */}
                    <FilterField label="Seller Competition" icon={<Users size={14} />}>
                        <select
                            className="input-field"
                            value={competition}
                            onChange={e => setCompetition(e.target.value)}
                            style={{ paddingLeft: 14 }}
                        >
                            {COMPETITION_LEVELS.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </FilterField>

                    {/* Revenue */}
                    <FilterField label="Revenue Target" icon={<TrendingUp size={14} />}>
                        <select
                            className="input-field"
                            value={revenueMin}
                            onChange={e => setRevenueMin(Number(e.target.value))}
                            style={{ paddingLeft: 14 }}
                        >
                            {REVENUE_OPTIONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </FilterField>

                    {/* Size */}
                    <FilterField label="Product Size" icon={<Package size={14} />}>
                        <select
                            className="input-field"
                            value={size}
                            onChange={e => setSize(e.target.value)}
                            style={{ paddingLeft: 14 }}
                        >
                            {SIZE_OPTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </FilterField>
                </div>

                <div style={{ marginTop: 22, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button
                        className="btn-primary"
                        style={{ padding: '12px 32px', fontSize: '1rem', gap: 10 }}
                        onClick={handleDiscover}
                        disabled={loading}
                    >
                        {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
                        {loading ? 'Scanning Amazon India…' : 'Find Top 25 Products'}
                    </button>
                    {searched && !loading && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Found <strong style={{ color: 'var(--text-primary)' }}>{products.length}</strong> products matching your criteria
                        </span>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 16, color: '#7c3aed' }} />
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                        Scanning Amazon India…
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                        Fetching live products, scoring by your criteria, ranking top 25
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{ padding: '14px 18px', marginBottom: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--accent-red)', fontSize: '0.875rem' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Results */}
            {!loading && products.length > 0 && (
                <>
                    {/* Summary Bar */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                        {[
                            { l: 'Products Found', v: products.length, icon: <Package size={16} />, c: '#7c3aed' },
                            { l: 'Low Competition', v: products.filter(p => p.competition_level === 'Low').length, icon: <TrendingUp size={16} />, c: '#10b981' },
                            { l: 'Avg Score', v: Math.round(products.reduce((s, p) => s + p.discovery_score, 0) / products.length) + '/100', icon: <Star size={16} />, c: '#f59e0b' },
                            { l: 'Best Revenue', v: '₹' + formatNumber(Math.max(...products.map(p => p.est_monthly_revenue))), icon: <DollarSign size={16} />, c: '#10b981' },
                        ].map(s => (
                            <div key={s.l} className="glass-card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 160px' }}>
                                <div style={{ color: s.c }}>{s.icon}</div>
                                <div>
                                    <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem', color: s.c }}>{s.v}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.l}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Product Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {products.map((p, idx) => {
                            const isExpanded = expandedIdx === idx;
                            const cc = compColor(p.competition_level);
                            return (
                                <div key={p.asin} className="glass-card" style={{ padding: '18px 22px', position: 'relative', overflow: 'hidden' }}>
                                    {/* Rank badge */}
                                    <div style={{
                                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
                                        background: `linear-gradient(180deg, ${scoreColor(p.discovery_score)}, transparent)`,
                                    }} />

                                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                        {/* Rank number */}
                                        <div style={{ minWidth: 36, textAlign: 'center' }}>
                                            <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.4rem', color: idx < 3 ? '#f59e0b' : 'var(--text-muted)', lineHeight: 1 }}>
                                                #{idx + 1}
                                            </div>
                                        </div>

                                        {/* Product Image */}
                                        {p.image_url && p.image_url.startsWith('http') ? (
                                            <img src={p.image_url} alt={p.title} style={{ width: 68, height: 68, objectFit: 'contain', borderRadius: 8, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
                                        ) : (
                                            <div style={{ width: 68, height: 68, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>📦</div>
                                        )}

                                        {/* Main Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {p.title}
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                                <span className="badge badge-purple">{p.asin}</span>
                                                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: cc.bg, color: cc.color }}>
                                                    {p.competition_level} Competition
                                                </span>
                                                <span className="badge badge-blue">{p.size_estimate} Size</span>
                                                {p.rating > 0 && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: '0.78rem', fontWeight: 600 }}>
                                                        <Star size={12} fill="#f59e0b" /> {p.rating}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Reasons */}
                                            {p.reasons && p.reasons.length > 0 && (
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {p.reasons.map((r, i) => (
                                                        <span key={i} style={{ padding: '2px 8px', background: 'rgba(124,58,237,0.1)', color: '#a78bfa', borderRadius: 20, fontSize: '0.7rem', border: '1px solid rgba(124,58,237,0.2)' }}>
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats */}
                                        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexShrink: 0 }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: '#7c3aed' }}>
                                                    {p.price > 0 ? `₹${formatNumber(p.price)}` : '—'}
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Price</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: '#10b981' }}>
                                                    ₹{formatNumber(p.est_monthly_revenue)}
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Est. Revenue/mo</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem', color: scoreColor(p.discovery_score) }}>
                                                    {p.discovery_score}
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{scoreLabel(p.discovery_score)}</div>
                                            </div>

                                            {/* Expand button */}
                                            <button
                                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                                                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                                            {[
                                                { l: 'ASIN', v: p.asin },
                                                { l: 'Price', v: p.price > 0 ? `₹${p.price.toFixed(0)}` : 'N/A' },
                                                { l: 'Rating', v: p.rating > 0 ? `${p.rating} ⭐` : 'N/A' },
                                                { l: 'Reviews', v: p.reviews > 0 ? formatNumber(p.reviews) : 'N/A' },
                                                { l: 'Est. Monthly Sales', v: formatNumber(p.est_monthly_sales) + ' units' },
                                                { l: 'Est. Monthly Revenue', v: '₹' + formatNumber(p.est_monthly_revenue) },
                                                { l: 'Competition', v: p.competition_level },
                                                { l: 'Product Size', v: p.size_estimate },
                                                { l: 'Discovery Score', v: `${p.discovery_score}/100 — ${scoreLabel(p.discovery_score)}` },
                                            ].map(s => (
                                                <div key={s.l}>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>{s.l}</div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.v}</div>
                                                </div>
                                            ))}
                                            <div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>Why Recommended</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                    {(p.reasons || []).map((r, i) => <span key={i} style={{ fontSize: '0.72rem', color: '#a78bfa' }}>{r}</span>)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                <a
                                                    href={`https://www.amazon.in/dp/${p.asin}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ padding: '8px 16px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 8, color: '#a78bfa', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}
                                                >
                                                    View on Amazon ↗
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Empty state */}
            {!loading && searched && products.length === 0 && !error && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔎</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                        No products matched your filters
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                        Try relaxing your criteria — e.g. remove the competition or revenue filter
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ---- FilterField helper ----
function FilterField({ label, icon, children }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
                {icon} {label}
            </div>
            {children}
        </div>
    );
}
