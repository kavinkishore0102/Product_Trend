import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, Search, Key, RefreshCw,
    Star, Zap, ArrowRight, Package, DollarSign, BarChart2, Users
} from 'lucide-react';
import {
    AreaChart, Area, ResponsiveContainer, Tooltip, XAxis
} from 'recharts';
import { api, formatNumber, formatCurrency } from '../api/client';
import './DashboardHome.css';

const tools = [
    { path: '/dashboard/research', label: 'ASIN Research', desc: 'Analyze any product instantly', icon: Search, color: '#7c3aed' },
    { path: '/dashboard/trends', label: 'Trend History', desc: 'See 12-month BSR & sales trends', icon: TrendingUp, color: '#10b981' },
    { path: '/dashboard/keywords', label: 'Keyword Research', desc: 'Find high-volume keywords', icon: Key, color: '#3b82f6' },
    { path: '/dashboard/cerebro', label: 'Reverse ASIN', desc: "Spy on competitor's keywords", icon: RefreshCw, color: '#f59e0b' },
    { path: '/dashboard/score', label: 'Product Score', desc: 'AI-powered health scoring', icon: Star, color: '#ec4899' },
];

export default function DashboardHome() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [trending, setTrending] = useState([]);
    const [trendingData, setTrendingData] = useState([]);

    useEffect(() => {
        api.getMarketStats().then(s => setStats(s)).catch(() => { });

        api.getTrending(8).then(d => setTrending(d.products || []));

        api.getTrending(1).then(d => {
            const base = d.products?.[0]?.monthly_sales ?? 5000;
            const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
            setTrendingData(months.map((m, i) => ({
                month: m,
                sales: Math.round(base * (0.8 + i * 0.03 + Math.random() * 0.05))
            })));
        });
    }, []);

    const quickStats = stats ? [
        { label: 'Products Tracked', value: stats.total_products, icon: Package, color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', change: '+12%' },
        { label: 'Est. Total Revenue', value: stats.total_revenue, icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.15)', change: '+8.4%' },
        { label: 'Keywords Indexed', value: stats.keywords_indexed, icon: Key, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', change: '+3.2%' },
        { label: 'Active Users', value: stats.active_users, icon: Users, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', change: '+21%' },
    ] : [];

    return (
        <div className="page-container">
            {/* Welcome */}
            <div className="dh-welcome">
                <div>
                    <h1>Good evening, Kavin 👋</h1>
                    <p>Here's what's trending on Amazon right now. Ready to find your next winner?</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/dashboard/research')}>
                    <Search size={16} /> Start Researching
                </button>
            </div>

            {/* Stats */}
            {quickStats.length > 0 && (
                <div className="dh-stats-grid">
                    {quickStats.map(s => (
                        <div key={s.label} className="stat-card">
                            <div className="dh-stat-top">
                                <div className="dh-stat-icon" style={{ background: s.bg, color: s.color }}>
                                    <s.icon size={20} />
                                </div>
                                <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                                    <TrendingUp size={11} /> {s.change}
                                </span>
                            </div>
                            <div className="dh-stat-value">{s.value}</div>
                            <div className="dh-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* 2-col layout */}
            <div className="dh-main-grid">
                {/* Market Trend Chart */}
                <div className="glass-card dh-chart-card">
                    <div className="dh-card-header">
                        <div>
                            <h3 className="dh-card-title">Market Sales Trend</h3>
                            <p className="dh-card-desc">Overall estimated Amazon sales volume (all categories)</p>
                        </div>
                        <span className="badge badge-green"><TrendingUp size={11} /> Rising</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={trendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#0d0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
                                labelStyle={{ color: '#94a3b8' }}
                                itemStyle={{ color: '#a855f7' }}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#7c3aed" strokeWidth={2.5} fill="url(#salesGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Quick Tools */}
                <div className="glass-card dh-tools-card">
                    <div className="dh-card-header">
                        <h3 className="dh-card-title">Research Tools</h3>
                        <span className="badge badge-purple"><Zap size={11} /> Pro</span>
                    </div>
                    <div className="dh-tools-list">
                        {tools.map(t => (
                            <div key={t.path} className="dh-tool-item" onClick={() => navigate(t.path)}>
                                <div className="dh-tool-icon" style={{ background: t.color + '22', color: t.color }}>
                                    <t.icon size={16} />
                                </div>
                                <div className="dh-tool-info">
                                    <div className="dh-tool-name">{t.label}</div>
                                    <div className="dh-tool-desc">{t.desc}</div>
                                </div>
                                <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Trending Products */}
            <div className="glass-card dh-products-card">
                <div className="dh-card-header" style={{ marginBottom: 20 }}>
                    <div>
                        <h3 className="dh-card-title">🔥 Trending Products Right Now</h3>
                        <p className="dh-card-desc">Top rising products by BSR movement this month — live from Go API</p>
                    </div>
                    <button className="btn-ghost" onClick={() => navigate('/dashboard/research')}>
                        View All <ArrowRight size={14} />
                    </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>ASIN</th>
                                <th>Est. Sales/mo</th>
                                <th>Revenue/mo</th>
                                <th>BSR</th>
                                <th>Reviews</th>
                                <th>Trend</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trending.map(p => (
                                <tr key={p.asin} style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/research')}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontSize: 22 }}>{p.image}</span>
                                            <div>
                                                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.brand}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{p.asin}</td>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatNumber(p.monthly_sales)}</td>
                                    <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{formatCurrency(p.monthly_revenue)}</td>
                                    <td>#{p.bsr}</td>
                                    <td>{formatNumber(p.reviews)}</td>
                                    <td>
                                        <span className={`badge ${p.trend === 'rising' ? 'badge-green' : p.trend === 'declining' ? 'badge-red' : 'badge-blue'}`}>
                                            {p.trend === 'rising' ? <TrendingUp size={11} /> : p.trend === 'declining' ? <TrendingDown size={11} /> : <BarChart2 size={11} />}
                                            {p.trend === 'rising' ? `+${p.trend_pct}%` : p.trend === 'declining' ? `${p.trend_pct}%` : 'Stable'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: `conic-gradient(${p.product_score >= 80 ? '#10b981' : p.product_score >= 60 ? '#f59e0b' : '#ef4444'} ${p.product_score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)'
                                        }}>
                                            {p.product_score}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {trending.length === 0 && (
                                <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Waiting for Go API… Start the backend with <code>cd backend && go run .</code>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
