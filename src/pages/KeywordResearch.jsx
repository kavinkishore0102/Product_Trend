import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api, formatNumber } from '../api/client';

const tooltipStyle = {
    contentStyle: { background: '#0d0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 },
    labelStyle: { color: '#94a3b8' },
};

const getDiffColor = (d) => d <= 35 ? 'var(--accent-green)' : d <= 60 ? 'var(--accent-orange)' : 'var(--accent-red)';
const compClass = { Low: 'badge-green', Medium: 'badge-orange', High: 'badge-red' };

export default function KeywordResearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const doSearch = async (q = query) => {
        setLoading(true);
        setError('');
        setSelected(null);
        try {
            const data = await api.searchKeywords(q);
            setResults(data.keywords || []);
        } catch (e) {
            setError(e.message);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Load all keywords on mount
    useEffect(() => { doSearch(''); }, []);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>🔑 Keyword Research <span style={{ fontSize: '1rem', fontWeight: 400 }}>— Magnet</span></h1>
                <p>Discover high-volume, low-competition keywords — data served live from Go API</p>
            </div>

            <div className="search-bar">
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                        className="input-field"
                        style={{ paddingLeft: 42 }}
                        placeholder="Enter any keyword (e.g. yoga mat, robot vacuum, wireless)…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && doSearch()}
                    />
                </div>
                <button className="btn-primary" onClick={() => doSearch()} disabled={loading}>
                    <Search size={16} /> {loading ? 'Searching…' : 'Find Keywords'}
                </button>
            </div>

            {error && (
                <div style={{ padding: '14px 18px', marginBottom: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--accent-red)', fontSize: '0.875rem' }}>
                    ⚠️ {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 600 }}>
                            {loading ? (
                                <span style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)' }}>
                                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Fetching keywords…
                                </span>
                            ) : `${results.length} keywords found`}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click a keyword to see its trend chart →</div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Keyword</th>
                                    <th>Search Volume</th>
                                    <th>Trend (MoM)</th>
                                    <th>Difficulty</th>
                                    <th>Competition</th>
                                    <th>CPC</th>
                                    <th>Top ASIN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map(kw => (
                                    <tr key={kw.keyword} style={{ cursor: 'pointer' }} onClick={() => setSelected(kw)}>
                                        <td><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{kw.keyword}</span></td>
                                        <td><span style={{ fontWeight: 700, color: 'var(--accent-violet)' }}>{formatNumber(kw.search_volume)}</span></td>
                                        <td>
                                            <span className={`badge ${kw.trend > 0 ? 'badge-green' : 'badge-red'}`}>
                                                {kw.trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                {kw.trend > 0 ? '+' : ''}{kw.trend}%
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, maxWidth: 80 }}>
                                                    <div style={{ width: `${kw.difficulty}%`, height: '100%', background: getDiffColor(kw.difficulty), borderRadius: 3 }} />
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: getDiffColor(kw.difficulty), fontWeight: 600 }}>{kw.difficulty}</span>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${compClass[kw.competition] || 'badge-blue'}`}>{kw.competition}</span></td>
                                        <td style={{ fontWeight: 600 }}>${kw.cpc}</td>
                                        <td><span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-violet)' }}>{kw.top_asin}</span></td>
                                    </tr>
                                ))}
                                {!loading && results.length === 0 && (
                                    <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No keywords found. Try a broader term.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Panel */}
                {selected && (
                    <div className="glass-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>"{selected.keyword}"</h3>
                            <button onClick={() => setSelected(null)} style={{ color: 'var(--text-muted)', fontSize: '1.1rem', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}>✕</button>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>Search volume trend — last 12 months</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                            {[
                                { l: 'Search Vol.', v: formatNumber(selected.search_volume), c: 'var(--accent-violet)' },
                                { l: 'MoM Change', v: `${selected.trend > 0 ? '+' : ''}${selected.trend}%`, c: selected.trend > 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
                                { l: 'Difficulty', v: selected.difficulty + '/100', c: getDiffColor(selected.difficulty) },
                                { l: 'CPC', v: '$' + selected.cpc, c: 'var(--accent-orange)' },
                            ].map(s => (
                                <div key={s.l} className="stat-card" style={{ padding: '12px 14px' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.c, fontFamily: 'Outfit' }}>{s.v}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.l}</div>
                                </div>
                            ))}
                        </div>

                        {selected.volume_history && (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={selected.volume_history.map(h => ({ month: h.month, volume: h.sales }))}>
                                    <defs>
                                        <linearGradient id="kwGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip {...tooltipStyle} formatter={v => [formatNumber(v), 'Search Volume']} />
                                    <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2.5} fill="url(#kwGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}

                        {selected.related_asins?.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>RANKING ASINS</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {selected.related_asins.map(a => (
                                        <span key={a} style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-violet)', padding: '4px 10px', background: 'rgba(124,58,237,0.1)', borderRadius: 6 }}>{a}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
