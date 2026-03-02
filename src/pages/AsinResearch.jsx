import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, TrendingDown, BarChart2, Download, Filter, RefreshCw } from 'lucide-react';
import { api, formatNumber, formatCurrency } from '../api/client';
import { SparklineChart } from '../components/SparklineChart';

const CATEGORIES = ['All', 'Electronics', 'Home & Kitchen', 'Sports & Outdoors', 'Pet Supplies', 'Beauty', 'Baby', 'Office Products', 'Clothing', 'Toys & Games', 'Books'];

function LoadingRow() {
    return (
        <tr>
            <td colSpan={9} style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Loading products from API…
                </div>
            </td>
        </tr>
    );
}

export default function AsinResearch() {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const doSearch = useCallback(async (q = query, cat = category) => {
        setLoading(true);
        setError('');
        setSearched(true);
        try {
            const data = await api.searchProducts(q, cat === 'All' ? '' : cat);
            setResults(data.products || []);
        } catch (e) {
            setError(e.message);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [query, category]);

    // Load all products on mount
    useEffect(() => { doSearch('', 'All'); }, []);

    const sumSales = results.reduce((s, p) => s + p.monthly_sales, 0);
    const sumRevenue = results.reduce((s, p) => s + p.monthly_revenue, 0);
    const avgBSR = results.length ? Math.round(results.reduce((s, p) => s + p.bsr, 0) / results.length) : 0;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>🔍 ASIN Research <span style={{ fontSize: '1rem', fontWeight: 400 }}>— Xray</span></h1>
                <p>Search any product, ASIN, brand, or category — powered by live Go API</p>
            </div>

            {/* Search Bar */}
            <div className="search-bar" style={{ flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                        className="input-field"
                        style={{ paddingLeft: 42 }}
                        placeholder="Search ASIN, product name, brand, or keyword…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && doSearch()}
                    />
                </div>
                <select
                    className="input-field"
                    style={{ width: 'auto', minWidth: 170 }}
                    value={category}
                    onChange={e => { setCategory(e.target.value); doSearch(query, e.target.value); }}
                >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <button className="btn-primary" onClick={() => doSearch()} disabled={loading}>
                    <Search size={16} /> {loading ? 'Searching…' : 'Analyze'}
                </button>
                <button className="btn-outline" onClick={() => { setQuery(''); doSearch('', 'All'); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Filter size={15} /> Reset
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: '14px 18px', marginBottom: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--accent-red)', fontSize: '0.875rem' }}>
                    ⚠️ {error} — is the Go backend running at <code>localhost:8080</code>?
                </div>
            )}

            {/* Summary Cards */}
            {searched && !loading && !error && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                    {[
                        { label: 'Products Found', value: results.length, color: '#7c3aed', icon: '📦' },
                        { label: 'Total Est. Sales', value: formatNumber(sumSales), color: '#10b981', icon: '📊' },
                        { label: 'Total Revenue', value: formatCurrency(sumRevenue), color: '#3b82f6', icon: '💰' },
                        { label: 'Avg BSR', value: '#' + avgBSR, color: '#f59e0b', icon: '🏆' },
                    ].map(s => (
                        <div key={s.label} className="stat-card">
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit' }}>{s.value}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Results Table */}
            {searched && (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {loading ? 'Fetching…' : `${results.length} products found`}
                        </div>
                        <button className="btn-ghost" style={{ fontSize: '0.8rem' }}>
                            <Download size={14} /> Export CSV
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>BSR</th>
                                    <th>Est. Sales/mo</th>
                                    <th>Revenue/mo</th>
                                    <th>Reviews</th>
                                    <th>Sellers</th>
                                    <th>Trend</th>
                                    <th>Trend Chart</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <LoadingRow /> : results.map(p => (
                                    <tr key={p.asin}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 22 }}>{p.image}</span>
                                                <div>
                                                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                                    <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.asin}</span>
                                                        <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{p.category}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${p.price}</td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--accent-violet)' }}>#{p.bsr}</span>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{(p.bsr_category || '').split(' > ')[0]}</div>
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatNumber(p.monthly_sales)}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(p.monthly_revenue)}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{formatNumber(p.reviews)}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--accent-orange)' }}>{'★'.repeat(Math.round(p.rating))} {p.rating}</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: 28, height: 28, borderRadius: '50%',
                                                background: p.seller_count <= 3 ? 'rgba(16,185,129,0.15)' : p.seller_count <= 7 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                                color: p.seller_count <= 3 ? 'var(--accent-green)' : p.seller_count <= 7 ? 'var(--accent-orange)' : 'var(--accent-red)',
                                                fontWeight: 700, fontSize: '0.82rem',
                                            }}>{p.seller_count}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${p.trend === 'rising' ? 'badge-green' : p.trend === 'declining' ? 'badge-red' : 'badge-blue'}`}>
                                                {p.trend === 'rising' ? <TrendingUp size={11} /> : p.trend === 'declining' ? <TrendingDown size={11} /> : <BarChart2 size={11} />}
                                                {p.trend === 'rising' ? `+${p.trend_pct}%` : p.trend === 'declining' ? `${p.trend_pct}%` : 'Stable'}
                                            </span>
                                        </td>
                                        <td><SparklineChart trend={p.trend} /></td>
                                    </tr>
                                ))}
                                {!loading && results.length === 0 && (
                                    <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No products found. Try a different search term.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
