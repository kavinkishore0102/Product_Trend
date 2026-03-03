import { useState } from 'react';
import { FileText, Star, CheckCircle, XCircle, AlertTriangle, Lightbulb, Search, RefreshCw, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { api, formatNumber } from '../api/client';

const CATEGORIES = [
    { value: '', label: 'Auto-detect' },
    { value: 'electronics', label: '📱 Electronics' },
    { value: 'home', label: '🏠 Home & Kitchen' },
    { value: 'toys', label: '🧸 Toys & Games' },
    { value: 'sports', label: '🏋️ Sports & Fitness' },
    { value: 'beauty', label: '💄 Beauty & Care' },
    { value: 'health', label: '💊 Health & Wellness' },
    { value: 'fashion', label: '👗 Fashion' },
    { value: 'baby', label: '👶 Baby Products' },
    { value: 'automotive', label: '🚗 Automotive' },
];

const GRADE_CONFIG = {
    A: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Excellent — Top Shelf!' },
    B: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'Good — Minor Fixes Needed' },
    C: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Average — Needs Work' },
    D: { color: '#f97316', bg: 'rgba(249,115,22,0.15)', label: 'Poor — Major Improvements' },
    F: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Failing — Rewrite Required' },
};

const ISSUE_CONFIG = {
    error: { icon: <XCircle size={14} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
    warning: { icon: <AlertTriangle size={14} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    tip: { icon: <Lightbulb size={14} />, color: '#a78bfa', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' },
};

const AREA_LABELS = { title: 'Title', bullets: 'Bullets', description: 'Description', keywords: 'Keywords' };

// Circular progress ring component
function ScoreRing({ score, max, label, color }) {
    const pct = Math.round((score / max) * 100);
    const r = 34;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <svg width={88} height={88} viewBox="0 0 88 88">
                <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                <circle cx={44} cy={44} r={r} fill="none" stroke={color} strokeWidth={6}
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeLinecap="round"
                    transform="rotate(-90 44 44)"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
                <text x={44} y={44} textAnchor="middle" dy="0.35em" fill={color} fontSize={15} fontWeight={800} fontFamily="Outfit">
                    {score}/{max}
                </text>
            </svg>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
        </div>
    );
}

export default function ListingOptimizer() {
    const [title, setTitle] = useState('');
    const [bullets, setBullets] = useState(['', '', '', '', '']);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [asin, setAsin] = useState('');

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeArea, setActiveArea] = useState('all');
    const [showMissing, setShowMissing] = useState(false);

    const handleAnalyze = async () => {
        if (!title.trim()) { setError('Please enter a product title.'); return; }
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const data = await api.optimizeListing({
                asin: asin.trim().toUpperCase(),
                title: title.trim(),
                bullets: bullets.filter(b => b.trim()),
                description: description.trim(),
                category,
            });
            if (data.error) throw new Error(data.error);
            setResult(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredIssues = result
        ? (activeArea === 'all' ? result.issues : result.issues.filter(i => i.area === activeArea))
        : [];

    const gradeConf = result ? GRADE_CONFIG[result.grade] || GRADE_CONFIG.F : null;

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <h1>📝 Listing Optimizer <span style={{ fontSize: '1rem', fontWeight: 400 }}>— Score & Fix</span></h1>
                <p>Paste your Amazon listing → get a score out of 100, find issues, and get actionable fixes</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24 }}>
                {/* ===== INPUT PANEL ===== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* ASIN (optional) */}
                    <div className="glass-card" style={{ padding: 20 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Optional</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input
                                className="input-field"
                                placeholder="ASIN (e.g. B0FYWTYXNW) — optional, for reference"
                                value={asin}
                                onChange={e => setAsin(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <select className="input-field" style={{ width: 180 }} value={category} onChange={e => setCategory(e.target.value)}>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Title */}
                    <InputSection label="Product Title" hint="80–200 characters · Title Case · Include key features" counter={title.length} counterMax={200} counterWarn={80}>
                        <textarea
                            className="input-field"
                            rows={3}
                            placeholder="e.g. SoundMax Pro Wireless Noise Cancelling Headphones | 40H Battery | Bluetooth 5.3 | Foldable | Black"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            style={{ resize: 'vertical' }}
                        />
                    </InputSection>

                    {/* Bullets */}
                    <InputSection label="Bullet Points" hint="5 bullets · 100–200 chars each · Start with CAPS keyword">
                        {bullets.map((b, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: i < 4 ? 8 : 0 }}>
                                <div style={{ minWidth: 22, height: 22, borderRadius: '50%', background: b.trim() ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: 10 }}>
                                    {i + 1}
                                </div>
                                <textarea
                                    className="input-field"
                                    rows={2}
                                    placeholder={`Bullet ${i + 1}: FEATURE — describe the benefit clearly...`}
                                    value={b}
                                    onChange={e => { const nb = [...bullets]; nb[i] = e.target.value; setBullets(nb); }}
                                    style={{ flex: 1, resize: 'vertical', fontSize: '0.875rem' }}
                                />
                            </div>
                        ))}
                    </InputSection>

                    {/* Description */}
                    <InputSection label="Product Description" hint="500–2000 chars · Use HTML for formatting (<b>, <br>, <ul>)" counter={description.length} counterMax={2000} counterWarn={500}>
                        <textarea
                            className="input-field"
                            rows={5}
                            placeholder="Enter your product description here — include use cases, materials, dimensions, warranty, brand story..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            style={{ resize: 'vertical' }}
                        />
                    </InputSection>

                    {/* Analyze Button */}
                    <button className="btn-primary" onClick={handleAnalyze} disabled={loading} style={{ alignSelf: 'flex-start', padding: '14px 36px', fontSize: '1rem' }}>
                        {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
                        {loading ? 'Analyzing…' : 'Analyze My Listing'}
                    </button>

                    {error && (
                        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#ef4444', fontSize: '0.875rem' }}>
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {/* ===== RESULTS PANEL ===== */}
                {result && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* Overall Score Card */}
                        <div className="glass-card" style={{ padding: 24, background: gradeConf.bg, border: `1px solid ${gradeConf.color}30` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                                {/* Big score circle */}
                                <div style={{ position: 'relative' }}>
                                    <svg width={110} height={110} viewBox="0 0 110 110">
                                        <circle cx={55} cy={55} r={46} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                                        <circle cx={55} cy={55} r={46} fill="none" stroke={gradeConf.color} strokeWidth={8}
                                            strokeDasharray={`${(result.overall_score / 100) * 2 * Math.PI * 46} ${2 * Math.PI * 46}`}
                                            strokeLinecap="round" transform="rotate(-90 55 55)"
                                            style={{ transition: 'all 1s ease' }}
                                        />
                                        <text x={55} y={50} textAnchor="middle" fill={gradeConf.color} fontSize={22} fontWeight={900} fontFamily="Outfit">{result.overall_score}</text>
                                        <text x={55} y={68} textAnchor="middle" fill={gradeConf.color} fontSize={12} fontWeight={600} fontFamily="Outfit">/100</text>
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '3rem', color: gradeConf.color, lineHeight: 1 }}>
                                        {result.grade}
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: gradeConf.color, marginBottom: 4 }}>{gradeConf.label}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {result.issues.filter(i => i.type === 'error').length} errors · {result.issues.filter(i => i.type === 'warning').length} warnings · {result.issues.filter(i => i.type === 'tip').length} tips
                                    </div>
                                </div>

                                {/* Sub-scores */}
                                <div style={{ display: 'flex', gap: 16, marginLeft: 'auto', flexWrap: 'wrap' }}>
                                    <ScoreRing score={result.title_score} max={result.title_max} label="Title" color="#7c3aed" />
                                    <ScoreRing score={result.bullet_score} max={result.bullet_max} label="Bullets" color="#3b82f6" />
                                    <ScoreRing score={result.description_score} max={result.description_max} label="Desc." color="#10b981" />
                                    <ScoreRing score={result.keyword_score} max={result.keyword_max} label="Keywords" color="#f59e0b" />
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                            {[
                                { l: 'Title Length', v: `${result.title_char_count} chars`, ok: result.title_char_count >= 80 && result.title_char_count <= 200 },
                                { l: 'Bullet Points', v: `${result.bullet_count} / 5`, ok: result.bullet_count >= 5 },
                                { l: 'Description', v: `${result.description_length} chars`, ok: result.description_length >= 500 },
                            ].map(s => (
                                <div key={s.l} className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {s.ok ? <CheckCircle size={16} color="#10b981" /> : <AlertTriangle size={16} color="#f59e0b" />}
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: s.ok ? '#10b981' : '#f59e0b' }}>{s.v}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.l}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Issues */}
                        <div className="glass-card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Issues & Tips</span>
                                {['all', 'title', 'bullets', 'description', 'keywords'].map(area => (
                                    <button key={area} onClick={() => setActiveArea(area)}
                                        style={{ padding: '4px 12px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: activeArea === area ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)', color: activeArea === area ? '#a78bfa' : 'var(--text-muted)' }}>
                                        {area === 'all' ? 'All' : AREA_LABELS[area]}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {filteredIssues.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 20, color: '#10b981', fontSize: '0.875rem' }}>
                                        <CheckCircle size={20} style={{ marginBottom: 6 }} />
                                        <div>No issues in this area — great job! 🎉</div>
                                    </div>
                                ) : filteredIssues.map((issue, i) => {
                                    const ic = ISSUE_CONFIG[issue.type];
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: ic.bg, border: `1px solid ${ic.border}` }}>
                                            <span style={{ color: ic.color, marginTop: 2 }}>{ic.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: ic.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 6 }}>
                                                    {AREA_LABELS[issue.area]}
                                                </span>
                                                <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{issue.message}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Suggestions */}
                        {result.suggestions && result.suggestions.length > 0 && (
                            <div className="glass-card" style={{ padding: 20 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>💡 Action Plan</div>
                                <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {result.suggestions.map((s, i) => (
                                        <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                            <span style={{ color: '#a78bfa', fontWeight: 600 }}></span> {s}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* Keyword Analysis */}
                        <div className="glass-card" style={{ padding: 20 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>🔑 Keyword Analysis</div>

                            {result.top_keywords && result.top_keywords.length > 0 && (
                                <>
                                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginBottom: 8 }}>✅ Found in your listing ({result.top_keywords.length})</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                                        {result.top_keywords.map((kw, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 999 }}>
                                                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{kw.keyword}</span>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatNumber(kw.search_volume)}</span>
                                                {kw.in_title && <span style={{ fontSize: '0.6rem', color: '#7c3aed', fontWeight: 700 }}>T</span>}
                                                {kw.in_bullets && <span style={{ fontSize: '0.6rem', color: '#3b82f6', fontWeight: 700 }}>B</span>}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {result.missing_keywords && result.missing_keywords.length > 0 && (
                                <>
                                    <button onClick={() => setShowMissing(!showMissing)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginBottom: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                                        {showMissing ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        ❌ Missing keywords you should add ({result.missing_keywords.length})
                                    </button>
                                    {showMissing && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {result.missing_keywords.map((kw, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 999 }}>
                                                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{kw.keyword}</span>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatNumber(kw.search_volume)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ---- Helper components ----
function InputSection({ label, hint, counter, counterMax, counterWarn, children }) {
    const over = counter > counterMax;
    const under = counter < counterWarn;
    const countColor = over ? '#ef4444' : under && counter > 0 ? '#f59e0b' : '#10b981';

    return (
        <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{label}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 10 }}>{hint}</span>
                </div>
                {counter !== undefined && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: countColor }}>{counter}/{counterMax}</span>
                )}
            </div>
            {children}
        </div>
    );
}
