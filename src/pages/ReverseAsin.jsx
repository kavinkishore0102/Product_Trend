import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Star, RefreshCw } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { api, formatNumber } from '../api/client';

const tooltipStyle = {
    contentStyle: { background: '#0d0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 },
    labelStyle: { color: '#94a3b8' },
};

export default function ReverseAsin() {
    const [asin, setAsin] = useState('');
    const [productName, setProductName] = useState('');
    const [productImage, setProductImage] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [allProducts, setAllProducts] = useState([]);

    useEffect(() => {
        api.getProducts().then(d => setAllProducts(d.products || []));
    }, []);

    const handleSearch = async (overrideAsin) => {
        const target = (overrideAsin || asin).trim().toUpperCase();
        if (!target) return;
        setLoading(true);
        setError('');
        try {
            const data = await api.getReverseASIN(target);
            setKeywords(data.keywords || []);
            setProductName(data.product || target);
            setProductImage(allProducts.find(p => p.asin === target)?.image || '📦');
            setAsin(target);
        } catch (e) {
            setError(e.message);
            setKeywords([]);
        } finally {
            setLoading(false);
        }
    };

    const topKeywords = keywords.slice(0, 6).map(k => ({
        name: k.keyword.slice(0, 28) + (k.keyword.length > 28 ? '…' : ''),
        volume: k.search_volume,
    }));

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>🔄 Reverse ASIN <span style={{ fontSize: '1rem', fontWeight: 400 }}>— Cerebro</span></h1>
                <p>See every keyword a competitor ranks for — organic and sponsored — and steal their traffic</p>
            </div>

            <div className="search-bar">
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                        className="input-field"
                        style={{ paddingLeft: 42 }}
                        placeholder="Enter any competitor ASIN (e.g. B0C3XQPWMN)…"
                        value={asin}
                        onChange={e => setAsin(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleSearch()} disabled={loading}>
                    <Search size={16} /> {loading ? 'Looking up…' : 'Reverse Lookup'}
                </button>
            </div>

            {/* Quick picks from live API */}
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
                    <div>Running reverse ASIN lookup…</div>
                </div>
            )}

            {error && (
                <div style={{ padding: '14px 18px', marginBottom: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--accent-red)', fontSize: '0.875rem' }}>
                    ⚠️ {error}
                </div>
            )}

            {keywords.length > 0 && !loading && (
                <>
                    {/* Product Banner */}
                    <div className="glass-card" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 32 }}>{productImage}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{productName}</div>
                            <span className="badge badge-purple">{asin}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 20 }}>
                            {[
                                { l: 'Total Keywords', v: keywords.length, c: '#7c3aed' },
                                { l: 'Organic', v: keywords.filter(k => k.organic_rank != null).length, c: '#10b981' },
                                { l: 'Sponsored', v: keywords.filter(k => k.sponsored_rank != null).length, c: '#f59e0b' },
                            ].map(s => (
                                <div key={s.l} style={{ textAlign: 'center' }}>
                                    <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem', color: s.c }}>{s.v}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.l}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart + Table */}
                    <div style={{ display: 'grid', gridTemplateColumns: topKeywords.length ? '380px 1fr' : '1fr', gap: 20, marginBottom: 20 }}>
                        {topKeywords.length > 0 && (
                            <div className="glass-card" style={{ padding: 24 }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16 }}>Top Keywords by Search Volume</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={topKeywords} layout="vertical" margin={{ left: 0, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                                        <Tooltip {...tooltipStyle} formatter={v => [formatNumber(v), 'Search Vol.']} />
                                        <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                                            {topKeywords.map((_, i) => (
                                                <Cell key={i} fill={`hsl(${262 + i * 15}, 70%, ${55 + i * 3}%)`} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: '0.9rem' }}>
                                All {keywords.length} keywords — competitor is ranking for these
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Keyword</th>
                                            <th>Search Vol.</th>
                                            <th>Organic Rank</th>
                                            <th>Sponsored Rank</th>
                                            <th>Trend</th>
                                            <th>Competition</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {keywords.map((kw, i) => (
                                            <tr key={i}>
                                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{kw.keyword}</td>
                                                <td style={{ color: 'var(--accent-violet)', fontWeight: 700 }}>{formatNumber(kw.search_volume)}</td>
                                                <td>
                                                    {kw.organic_rank != null ? (
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            width: 30, height: 30, borderRadius: '50%', fontWeight: 700, fontSize: '0.8rem',
                                                            background: kw.organic_rank <= 5 ? 'rgba(16,185,129,0.2)' : kw.organic_rank <= 15 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                                                            color: kw.organic_rank <= 5 ? 'var(--accent-green)' : kw.organic_rank <= 15 ? 'var(--accent-orange)' : 'var(--text-muted)',
                                                        }}>#{kw.organic_rank}</span>
                                                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                                                </td>
                                                <td>
                                                    {kw.sponsored_rank != null ? (
                                                        <span className="badge badge-orange" style={{ fontSize: '0.72rem' }}>
                                                            <Star size={10} /> #{kw.sponsored_rank}
                                                        </span>
                                                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                                                </td>
                                                <td>
                                                    <span className={`badge ${kw.trend > 0 ? 'badge-green' : 'badge-red'}`}>
                                                        {kw.trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                        {kw.trend > 0 ? '+' : ''}{kw.trend}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${kw.competition === 'Low' ? 'badge-green' : kw.competition === 'Medium' ? 'badge-orange' : 'badge-red'}`}>
                                                        {kw.competition}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
