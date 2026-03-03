import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { api } from '../api/client';

const tooltipStyle = {
    contentStyle: { background: '#0d0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 },
    labelStyle: { color: '#94a3b8' },
};

export default function TrendHistory() {
    const [asin, setAsin] = useState('');
    const [product, setProduct] = useState(null);
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (overrideAsin) => {
        const target = (overrideAsin || asin).trim().toUpperCase();
        if (!target) return;
        setLoading(true);
        setError('');
        try {
            const [p, h] = await Promise.all([
                api.getProduct(target),
                api.getProductHistory(target),
            ]);
            setProduct(p);
            setHistory(h);
            setAsin(target);
        } catch (e) {
            setError(e.message);
            setProduct(null);
            setHistory(null);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all ASINs for quick-pick buttons
    const [allProducts, setAllProducts] = useState([]);
    useState(() => { api.getProducts().then(d => setAllProducts(d.products || [])); }, []);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>📈 Trend History <span style={{ fontSize: '1rem', fontWeight: 400 }}>— Trendster</span></h1>
                <p>Visualize BSR history, price changes, and sales trends over the last 12 months</p>
            </div>

            <div className="search-bar">
                <input
                    className="input-field"
                    placeholder="Enter any ASIN (e.g. B0BVXQKTFW)…"
                    value={asin}
                    onChange={e => setAsin(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button className="btn-primary" onClick={() => handleSearch()} disabled={loading}>
                    <Search size={16} /> {loading ? 'Loading…' : 'Load History'}
                </button>
            </div>

            {/* Quick-pick product buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {allProducts.slice(0, 12).map(p => (
                    <button key={p.asin} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                        onClick={() => handleSearch(p.asin)}>
                        {p.image} {p.asin}
                    </button>
                ))}
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                    <div>Fetching product history from API…</div>
                </div>
            )}

            {error && (
                <div style={{ padding: '14px 18px', marginBottom: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--accent-red)', fontSize: '0.875rem' }}>
                    ⚠️ {error}
                </div>
            )}

            {product && history && !loading && (
                <>
                    {/* Product Banner */}
                    <div className="glass-card" style={{ padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        {product.image && product.image.startsWith('http')
                            ? <img src={product.image} alt={product.name} style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 10, background: 'rgba(255,255,255,0.05)' }} />
                            : <span style={{ fontSize: 36 }}>📦</span>
                        }
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{product.name}</h2>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span className="badge badge-purple">{product.asin}</span>
                                <span className="badge badge-blue">{product.category}</span>
                                <span className={`badge ${product.trend === 'rising' ? 'badge-green' : product.trend === 'declining' ? 'badge-red' : 'badge-blue'}`}>
                                    {product.trend === 'rising' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                    {product.trend}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 24 }}>
                            {[
                                { l: 'Current BSR', v: '#' + product.bsr, c: 'var(--accent-violet)' },
                                { l: 'Price', v: '$' + product.price, c: 'var(--accent-green)' },
                                { l: 'Score', v: product.product_score + '/100', c: 'var(--accent-orange)' },
                            ].map(s => (
                                <div key={s.l} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.c, fontFamily: 'Outfit' }}>{s.v}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.l}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                        <div className="glass-card" style={{ padding: 24 }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>BSR History (12 Months)</h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>Lower = Better rank</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={history.bsr_history}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} reversed />
                                    <Tooltip {...tooltipStyle} formatter={v => ['#' + v, 'BSR']} />
                                    <Line type="monotone" dataKey="bsr" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="glass-card" style={{ padding: 24 }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>Price History (12 Months)</h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>Price fluctuations over time</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={history.price_history}>
                                    <defs>
                                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip {...tooltipStyle} formatter={v => ['$' + v, 'Price']} />
                                    <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2.5} fill="url(#priceGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>Sales & Revenue (12 Months)</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>Estimated monthly sales and revenue</p>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={history.sales_history} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip {...tooltipStyle} />
                                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                                <Bar yAxisId="left" dataKey="sales" name="Est. Sales" fill="#7c3aed" radius={[4, 4, 0, 0]} opacity={0.85} />
                                <Bar yAxisId="right" dataKey="revenue" name="Revenue ($)" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.7} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
