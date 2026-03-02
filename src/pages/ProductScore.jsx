import { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    RadialBarChart, RadialBar, Tooltip
} from 'recharts';
import { api, formatNumber, formatCurrency } from '../api/client';

const tooltipStyle = {
    contentStyle: { background: '#0d0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 },
    labelStyle: { color: '#94a3b8' },
};

function ScoreGauge({ score }) {
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="90%" data={[{ name: 'Score', value: score, fill: color }]} startAngle={225} endAngle={-45}>
                    <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.04)' }} />
                </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'Outfit', fontSize: '3rem', fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>out of 100</div>
            </div>
        </div>
    );
}

const getScoreLabel = (s) => s >= 80
    ? { l: 'Excellent', icon: CheckCircle, c: '#10b981', bc: 'badge-green' }
    : s >= 60
        ? { l: 'Good', icon: AlertTriangle, c: '#f59e0b', bc: 'badge-orange' }
        : { l: 'Risky', icon: XCircle, c: '#ef4444', bc: 'badge-red' };

function buildRadarData(p) {
    return [
        { subject: 'Sales Trend', A: Math.min(100, p.trend === 'rising' ? Math.round(75 + p.trend_pct * 0.5) : p.trend === 'declining' ? 30 : 55) },
        { subject: 'Competition', A: Math.max(0, 100 - p.seller_count * 12) },
        { subject: 'Review Growth', A: Math.min(100, Math.round(p.reviews / 250)) },
        { subject: 'Price Stability', A: p.trend === 'declining' ? 40 : Math.min(100, 70 + Math.round(p.product_score * 0.1)) },
        { subject: 'BSR Strength', A: Math.max(0, 100 - Math.round(p.bsr / 5)) },
        { subject: 'Demand', A: Math.min(100, Math.round(p.monthly_sales / 120)) },
    ];
}

function buildRecommendations(p) {
    const items = [];
    if (p.trend === 'rising') items.push({ type: 'good', text: `Strong upward sales trend (+${p.trend_pct}% MoM) — market demand is growing.` });
    if (p.seller_count <= 3) items.push({ type: 'good', text: 'Low seller count — market not yet saturated, entry window is open.' });
    if (p.reviews > 10000) items.push({ type: 'warn', text: 'High review count — existing sellers have strong social proof advantage.' });
    if (p.seller_count > 6) items.push({ type: 'warn', text: 'Multiple sellers competing — expect stronger price pressure.' });
    if (p.trend === 'declining') items.push({ type: 'bad', text: 'Sales declining — investigate whether this is seasonal or structural.' });
    if (p.bsr < 200) items.push({ type: 'good', text: `Excellent BSR (#${p.bsr}) — strong organic discovery on Amazon.` });
    if (p.rating >= 4.7) items.push({ type: 'good', text: `Top-tier rating ${p.rating}★ — customers love this product.` });
    return items;
}

export default function ProductScore() {
    const [asin, setAsin] = useState('');
    const [product, setProduct] = useState(null);
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
            const p = await api.getProduct(target);
            setProduct(p);
            setAsin(target);
        } catch (e) {
            setError(e.message);
            setProduct(null);
        } finally {
            setLoading(false);
        }
    };

    const scoreLabel = product ? getScoreLabel(product.product_score) : null;
    const radarData = product ? buildRadarData(product) : [];
    const recommendations = product ? buildRecommendations(product) : [];

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>💯 Product Score <span style={{ fontSize: '1rem', fontWeight: 400 }}>— AI Health Scoring</span></h1>
                <p>Multi-dimensional AI score on product viability, market health, and competition — powered by Go API</p>
            </div>

            <div className="search-bar">
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                        className="input-field"
                        style={{ paddingLeft: 42 }}
                        placeholder="Enter any ASIN to score…"
                        value={asin}
                        onChange={e => setAsin(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleSearch()} disabled={loading}>
                    {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : '💯'} {loading ? 'Scoring…' : 'Score Product'}
                </button>
            </div>

            {/* Live quick picks */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {allProducts.slice(0, 12).map(p => (
                    <button key={p.asin} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                        onClick={() => handleSearch(p.asin)}>
                        {p.image} {p.asin}
                    </button>
                ))}
            </div>

            {error && (
                <div style={{ padding: '14px 18px', marginBottom: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--accent-red)', fontSize: '0.875rem' }}>
                    ⚠️ {error}
                </div>
            )}

            {product && scoreLabel && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, marginBottom: 20 }}>
                        {/* Score Gauge */}
                        <div className="glass-card" style={{ padding: 28, textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                                Overall Product Score
                            </div>
                            <ScoreGauge score={product.product_score} />
                            <span className={`badge ${scoreLabel.bc}`} style={{ marginTop: 12, fontSize: '0.85rem', padding: '6px 16px' }}>
                                <scoreLabel.icon size={14} /> {scoreLabel.l}
                            </span>
                            <div style={{ marginTop: 20, textAlign: 'left' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{product.name}</div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.asin}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{product.category} › {product.subcategory}</div>
                            </div>
                        </div>

                        {/* Radar + Dimension Bars */}
                        <div className="glass-card" style={{ padding: 24 }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Score Dimensions</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    {radarData.map(d => (
                                        <div key={d.subject} style={{ marginBottom: 14 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>{d.subject}</span>
                                                <span style={{ fontWeight: 700, color: d.A >= 70 ? 'var(--accent-green)' : d.A >= 45 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>{d.A}</span>
                                            </div>
                                            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                                                <div style={{ width: `${d.A}%`, height: '100%', borderRadius: 3, background: d.A >= 70 ? 'var(--accent-green)' : d.A >= 45 ? 'var(--accent-orange)' : 'var(--accent-red)' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <Radar name={product.name} dataKey="A" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} strokeWidth={2} />
                                        <Tooltip {...tooltipStyle} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                        {[
                            { l: 'Est. Sales/mo', v: formatNumber(product.monthly_sales), icon: '📦', c: '#7c3aed' },
                            { l: 'Revenue/mo', v: formatCurrency(product.monthly_revenue), icon: '💰', c: '#10b981' },
                            { l: 'Reviews', v: formatNumber(product.reviews), icon: '⭐', c: '#f59e0b' },
                            { l: 'Seller Count', v: product.seller_count, icon: '🏪', c: product.seller_count <= 3 ? '#10b981' : product.seller_count <= 6 ? '#f59e0b' : '#ef4444' },
                        ].map(s => (
                            <div key={s.l} className="stat-card">
                                <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
                                <div style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 800, color: s.c }}>{s.v}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.l}</div>
                            </div>
                        ))}
                    </div>

                    {/* Recommendations */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>🤖 AI Analysis & Recommendations</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {recommendations.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No specific recommendations for this product.</span>}
                            {recommendations.map((r, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 10,
                                    fontSize: '0.875rem',
                                    background: r.type === 'good' ? 'rgba(16,185,129,0.08)' : r.type === 'warn' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                                    border: `1px solid ${r.type === 'good' ? 'rgba(16,185,129,0.2)' : r.type === 'warn' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                }}>
                                    {r.type === 'good' ? <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
                                        : r.type === 'warn' ? <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                                            : <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />}
                                    <span style={{ color: 'var(--text-secondary)' }}>{r.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
