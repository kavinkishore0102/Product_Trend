import { useState, useEffect, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer
} from 'recharts';
import {
    Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, Minus,
    Star, AlertTriangle, BarChart2, Clock
} from 'lucide-react';
import { api, formatNumber } from '../api/client';

// ---- Constants ----
const MAX_ASINS = 5;
const STORAGE_KEY = 'trendspy_market_tracker_v2';
const ASIN_COLORS = ['#7c3aed', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'];

// ---- Helpers ----
const fmt = (n) => typeof n === 'number' ? n.toLocaleString('en-IN') : '—';
const fmtTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' +
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};
const shortTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + '\n' +
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

function delta(curr, prev) {
    if (!prev || prev === 0) return null;
    return ((curr - prev) / Math.abs(prev)) * 100;
}

function DeltaBadge({ value, flipSign = false }) {
    if (value === null || value === undefined) return null;
    const positive = flipSign ? value < 0 : value > 0;
    const color = positive ? '#10b981' : '#ef4444';
    const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: '0.7rem', fontWeight: 700, color }}>
            <Icon size={11} /> {Math.abs(value).toFixed(1)}%
        </span>
    );
}

// Custom recharts tooltip
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#1a1b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 6 }}>{label}</div>
            {payload.map(p => (
                <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{p.name}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: p.color }}>
                        {typeof p.value === 'number' && p.value > 100 ? '₹' + fmt(Math.round(p.value)) : fmt(p.value)}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MarketTracker() {
    const [inputAsin, setInputAsin] = useState('');
    const [watchlist, setWatchlist] = useState([]);   // [{ asin, color }]
    const [history, setHistory] = useState([]);   // [{fetchedAt, snapshots:[{asin,title,price,rating,reviews,imageUrl}]}]
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeChart, setActiveChart] = useState('price'); // 'price' | 'reviews'

    // ---- Load from localStorage ----
    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (stored?.watchlist) setWatchlist(stored.watchlist);
            if (stored?.history) setHistory(stored.history);
        } catch { /* ignore */ }
    }, []);

    // ---- Persist to localStorage ----
    const persist = useCallback((wl, hist) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ watchlist: wl, history: hist }));
        } catch { /* ignore quota */ }
    }, []);

    // ---- Add ASIN ----
    const addAsin = () => {
        const asin = inputAsin.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!asin || asin.length < 5) { setError('Enter a valid ASIN (e.g. B0FYWTYXNW)'); return; }
        if (watchlist.length >= MAX_ASINS) { setError(`Maximum ${MAX_ASINS} ASINs allowed.`); return; }
        if (watchlist.some(w => w.asin === asin)) { setError('ASIN already in watchlist.'); return; }
        const color = ASIN_COLORS[watchlist.length];
        const newWl = [...watchlist, { asin, color }];
        setWatchlist(newWl);
        persist(newWl, history);
        setInputAsin('');
        setError('');
    };

    // ---- Remove ASIN ----
    const removeAsin = (asin) => {
        const newWl = watchlist.filter(w => w.asin !== asin);
        // Re-assign colors
        const recolored = newWl.map((w, i) => ({ ...w, color: ASIN_COLORS[i] }));
        setWatchlist(recolored);
        persist(recolored, history);
    };

    // ---- Refresh / Fetch Data ----
    const refreshAll = async () => {
        if (watchlist.length === 0) { setError('Add at least one ASIN first.'); return; }
        setLoading(true);
        setError('');
        try {
            const data = await api.compareASINs(watchlist.map(w => w.asin));
            if (data.error) throw new Error(data.error);

            const newEntry = {
                fetchedAt: data.fetched_at,
                snapshots: data.snapshots,
            };
            const newHistory = [...history, newEntry].slice(-30); // keep last 30 snapshots
            setHistory(newHistory);
            persist(watchlist, newHistory);
        } catch (e) {
            setError('Failed to fetch: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    // ---- Derived data ----
    const latest = history.length > 0 ? history[history.length - 1].snapshots : [];
    const prev = history.length > 1 ? history[history.length - 2].snapshots : [];

    const getSnap = (snapshots, asin) => snapshots?.find(s => s.asin === asin);

    // Chart data: one row per history entry, columns per ASIN
    const priceChartData = history.map(h => {
        const row = { time: shortTime(h.fetchedAt) };
        watchlist.forEach(w => {
            const snap = h.snapshots.find(s => s.asin === w.asin);
            row[w.asin] = snap?.price > 0 ? snap.price : null;
        });
        return row;
    });

    const reviewChartData = history.map(h => {
        const row = { time: shortTime(h.fetchedAt) };
        watchlist.forEach(w => {
            const snap = h.snapshots.find(s => s.asin === w.asin);
            row[w.asin] = snap?.reviews > 0 ? snap.reviews : null;
        });
        return row;
    });

    const chartData = activeChart === 'price' ? priceChartData : reviewChartData;

    // Market share: estimate from reviews (proxy for total sales)
    const totalReviews = latest.reduce((s, snap) => s + (snap.reviews || 0), 0);

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <h1>📊 Market Tracker <span style={{ fontSize: '1rem', fontWeight: 400 }}>— Competitor Intelligence</span></h1>
                <p>Track up to 5 ASINs over time · compare BSR trends · see who's winning the market</p>
            </div>

            {/* ---- Add ASIN bar ---- */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Add ASIN to Watchlist ({watchlist.length}/{MAX_ASINS})
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            className="input-field"
                            placeholder="e.g. B0FYWTYXNW"
                            value={inputAsin}
                            onChange={e => setInputAsin(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addAsin()}
                            style={{ flex: 1, letterSpacing: '0.05em' }}
                        />
                        <button className="btn-primary" onClick={addAsin} disabled={watchlist.length >= MAX_ASINS} style={{ padding: '11px 20px' }}>
                            <Plus size={16} /> Add
                        </button>
                    </div>
                    {error && <div style={{ marginTop: 8, color: '#ef4444', fontSize: '0.8rem' }}>⚠️ {error}</div>}
                </div>

                {/* Watchlist chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', flex: 2 }}>
                    {watchlist.map(w => (
                        <div key={w.asin} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: w.color + '20', border: `1px solid ${w.color}50`, borderRadius: 999 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: w.color }} />
                            <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.85rem', color: w.color }}>{w.asin}</span>
                            {getSnap(latest, w.asin)?.title && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 120, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {getSnap(latest, w.asin).title.slice(0, 30)}…
                                </span>
                            )}
                            <button onClick={() => removeAsin(w.asin)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                    {watchlist.length === 0 && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No ASINs added yet — add your products and competitors above</span>
                    )}
                </div>

                {/* Refresh button */}
                <button className="btn-primary" onClick={refreshAll} disabled={loading || watchlist.length === 0}
                    style={{ padding: '12px 24px', alignSelf: 'flex-end' }}>
                    {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                    {loading ? 'Fetching…' : 'Refresh All'}
                </button>
            </div>

            {/* ---- Loading ---- */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#7c3aed', marginBottom: 12 }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Fetching live data from Amazon India…</div>
                    <div style={{ fontSize: '0.82rem' }}>Querying {watchlist.length} ASINs in parallel via ScraperAPI</div>
                </div>
            )}

            {/* ---- NO DATA: guidance ---- */}
            {!loading && history.length === 0 && watchlist.length > 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 8 }}>Ready to track!</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Click <strong>Refresh All</strong> to fetch the first snapshot. Data builds up over time as you refresh.</div>
                </div>
            )}

            {/* ---- RESULTS ---- */}
            {!loading && history.length > 0 && (
                <>
                    {/* Last updated */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <Clock size={13} /> Last updated: {fmtTime(history[history.length - 1].fetchedAt)}
                        &nbsp;·&nbsp; {history.length} snapshot{history.length !== 1 ? 's' : ''} recorded
                    </div>

                    {/* ---- Comparison cards row ---- */}
                    <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                        {watchlist.map((w, i) => {
                            const snap = getSnap(latest, w.asin);
                            const prevSnap = getSnap(prev, w.asin);
                            if (!snap) return null;
                            const share = totalReviews > 0 ? ((snap.reviews || 0) / totalReviews * 100) : 0;
                            const priceDelta = prevSnap ? delta(snap.price, prevSnap.price) : null;
                            const reviewDelta = prevSnap ? delta(snap.reviews, prevSnap.reviews) : null;
                            const isTop = i === 0;

                            return (
                                <div key={w.asin} className="glass-card" style={{ flex: '1 1 200px', padding: '18px 20px', borderLeft: `4px solid ${w.color}`, position: 'relative' }}>
                                    {/* Product image + title */}
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                                        {snap.image_url?.startsWith('http') ? (
                                            <img src={snap.image_url} alt={snap.asin} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
                                        ) : (
                                            <div style={{ width: 44, height: 44, borderRadius: 6, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📦</div>
                                        )}
                                        <div>
                                            <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.78rem', color: w.color }}>{snap.asin}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {snap.title || 'Unknown product'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        {[
                                            { l: 'Price', v: snap.price > 0 ? `₹${fmt(snap.price)}` : '—', delta: priceDelta, flipSign: true },
                                            { l: 'Rating', v: snap.rating > 0 ? `${snap.rating} ⭐` : '—', delta: null },
                                            { l: 'Reviews', v: snap.reviews > 0 ? fmt(snap.reviews) : '—', delta: reviewDelta, flipSign: false },
                                            { l: 'Est. Share', v: `${share.toFixed(1)}%`, delta: null },
                                        ].map(m => (
                                            <div key={m.l} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                                                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 2 }}>{m.l}</div>
                                                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{m.v}</div>
                                                {m.delta !== null && <DeltaBadge value={m.delta} flipSign={m.flipSign} />}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Market share bar */}
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${share}%`, background: w.color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3 }}>Market share (reviews proxy)</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ---- Charts ---- */}
                    <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <BarChart2 size={16} color="#7c3aed" /> Trend Over Time
                            </span>
                            {['price', 'reviews'].map(tab => (
                                <button key={tab} onClick={() => setActiveChart(tab)}
                                    style={{ padding: '5px 14px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: activeChart === tab ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)', color: activeChart === tab ? '#a78bfa' : 'var(--text-muted)' }}>
                                    {tab === 'price' ? '💰 Price' : '💬 Reviews'}
                                </button>
                            ))}
                            {history.length < 3 && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                    ⏳ Refresh a few more times to see trends develop
                                </span>
                            )}
                        </div>

                        {chartData.length >= 2 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }}
                                        tickFormatter={v => activeChart === 'price' ? `₹${v >= 1000 ? (v / 1000).toFixed(1) + 'K' : v}` : v >= 1000 ? (v / 1000).toFixed(1) + 'K' : v} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                                    {watchlist.map(w => (
                                        <Line key={w.asin} type="monotone" dataKey={w.asin}
                                            stroke={w.color} strokeWidth={2.5} dot={{ r: 4, fill: w.color }}
                                            activeDot={{ r: 6 }} connectNulls name={w.asin} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <BarChart2 size={36} style={{ marginBottom: 16, opacity: 0.3 }} />
                                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Need 2+ snapshots for trends</div>
                                <div style={{ fontSize: '0.82rem', marginTop: 6 }}>Click "Refresh All" again in a few hours to see price/review trends</div>
                            </div>
                        )}
                    </div>

                    {/* ---- Comparison Table ---- */}
                    <div className="glass-card" style={{ padding: 22 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 16 }}>📋 Side-by-Side Comparison</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ minWidth: 600 }}>
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        {watchlist.map(w => (
                                            <th key={w.asin} style={{ color: w.color }}>{w.asin}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { l: 'Brand', get: s => s.brand || '—' },
                                        { l: 'Category', get: s => s.category || '—' },
                                        { l: 'Price (₹)', get: s => s.price > 0 ? `₹${fmt(s.price)}` : '—' },
                                        { l: 'Rating', get: s => s.rating > 0 ? `${s.rating} ⭐` : '—' },
                                        { l: 'Reviews', get: s => s.reviews > 0 ? fmt(s.reviews) : '—' },
                                        { l: 'Est. Revenue', get: s => s.price > 0 && s.reviews > 0 ? `₹${fmt(Math.round(s.price * s.reviews * 0.06))}` : '—' },
                                        { l: 'Market Share', get: (s) => totalReviews > 0 && s.reviews > 0 ? `${((s.reviews / totalReviews) * 100).toFixed(1)}%` : '—' },
                                    ].map(row => (
                                        <tr key={row.l}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{row.l}</td>
                                            {watchlist.map(w => {
                                                const snap = getSnap(latest, w.asin);
                                                return <td key={w.asin} style={{ color: 'var(--text-primary)' }}>{snap ? row.get(snap) : '—'}</td>;
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ---- Winner Analysis ---- */}
                    {latest.length > 1 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 18 }}>
                            {[
                                { label: '💰 Lowest Price', asin: latest.filter(s => s.price > 0).sort((a, b) => a.price - b.price)[0]?.asin },
                                { label: '⭐ Highest Rating', asin: latest.filter(s => s.rating > 0).sort((a, b) => b.rating - a.rating)[0]?.asin },
                                { label: '💬 Most Reviews', asin: latest.filter(s => s.reviews > 0).sort((a, b) => b.reviews - a.reviews)[0]?.asin },
                                { label: '📈 Best Revenue', asin: latest.filter(s => s.price > 0 && s.reviews > 0).sort((a, b) => (b.price * b.reviews) - (a.price * a.reviews))[0]?.asin },
                            ].filter(w => !!w.asin).map(w => {
                                const wl = watchlist.find(x => x.asin === w.asin);
                                return (
                                    <div key={w.label} className="glass-card" style={{ padding: '14px 18px', background: wl?.color ? wl.color + '15' : undefined, border: `1px solid ${wl?.color || 'var(--border-subtle)'}30` }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{w.label}</div>
                                        <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', color: wl?.color || 'var(--text-primary)' }}>{w.asin}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
