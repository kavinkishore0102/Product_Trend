import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calculator, RefreshCw, Info } from 'lucide-react';

// ---- Amazon India referral fees by category ----
const CATEGORIES = [
    { value: 'electronics', label: '📱 Electronics', fee: 8 },
    { value: 'computers', label: '💻 Computers', fee: 8 },
    { value: 'home', label: '🏠 Home & Kitchen', fee: 12 },
    { value: 'kitchen', label: '🍳 Kitchen', fee: 12 },
    { value: 'toys', label: '🧸 Toys & Games', fee: 15 },
    { value: 'sports', label: '🏋️ Sports & Fitness', fee: 15 },
    { value: 'beauty', label: '💄 Beauty & Care', fee: 15 },
    { value: 'health', label: '💊 Health & Wellness', fee: 12 },
    { value: 'baby', label: '👶 Baby Products', fee: 15 },
    { value: 'fashion', label: '👗 Fashion', fee: 15 },
    { value: 'automotive', label: '🚗 Automotive', fee: 10 },
    { value: 'garden', label: '🌿 Garden & Outdoor', fee: 12 },
    { value: 'books', label: '📚 Books', fee: 10 },
    { value: 'grocery', label: '🛒 Grocery & Food', fee: 4 },
    { value: 'office', label: '🖊️ Office Supplies', fee: 12 },
];

// ---- Amazon India FBA fulfillment fees (₹ per unit) ----
const SIZE_TIERS = [
    { value: 'small', label: '📦 Small (≤ 300g)', fee: 38 },
    { value: 'standard', label: '📦 Standard (301g – 1kg)', fee: 58 },
    { value: 'medium', label: '📦 Medium (1kg – 3kg)', fee: 90 },
    { value: 'large', label: '📦 Large (3kg – 5kg)', fee: 130 },
    { value: 'xlarge', label: '📦 Extra Large (5kg – 12kg)', fee: 200 },
    { value: 'self', label: '🚚 Self-fulfilled (MFN)', fee: 0 },
];

// ---- Number helpers ----
const fmt = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) => n.toFixed(1) + '%';

// ---- Doughnut Chart ----
function Doughnut({ slices, size = 160, thickness = 26 }) {
    const r = (size - thickness) / 2;
    const circ = 2 * Math.PI * r;
    const cx = size / 2, cy = size / 2;
    let cumulative = 0;
    const total = slices.reduce((s, sl) => s + sl.value, 0);
    if (total === 0) return null;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices.map((sl, i) => {
                const frac = sl.value / total;
                const dash = frac * circ;
                const offset = -cumulative * circ;
                cumulative += frac;
                return (
                    <circle key={i} cx={cx} cy={cy} r={r}
                        fill="none" stroke={sl.color} strokeWidth={thickness}
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={offset}
                        transform={`rotate(-90 ${cx} ${cy})`}
                    />
                );
            })}
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#f1f5f9" fontSize={13} fontWeight={800} fontFamily="Outfit">
                Net
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#10b981" fontSize={13} fontWeight={800} fontFamily="Outfit">
                {pct(((slices.find(s => s.label === 'Profit')?.value || 0) / total) * 100)}
            </text>
        </svg>
    );
}

// ---- Metric card ----
function MetricCard({ label, value, sub, color = 'var(--text-primary)', icon }) {
    return (
        <div className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {icon && <span style={{ color }}>{icon}</span>}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            </div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.5rem', color }}>{value}</div>
            {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

// ---- Range Slider ----
function Slider({ label, value, min, max, step = 1, hint, unit = '₹', onChange }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {unit === '%' ? `${value}%` : `₹${value.toLocaleString('en-IN')}`}
                </span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer', height: 4 }}
            />
            {hint && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{hint}</div>}
        </div>
    );
}

// ---- Number input ----
function NumInput({ label, value, min = 0, unit = '₹', hint, onChange }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                {hint && <span title={hint} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'help' }}>ⓘ</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden' }}>
                <span style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.85rem', borderRight: '1px solid var(--glass-border)' }}>{unit}</span>
                <input type="number" value={value} min={min}
                    onChange={e => onChange(Math.max(min, Number(e.target.value)))}
                    style={{ flex: 1, padding: '10px 12px', background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'Outfit' }}
                />
            </div>
        </div>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ProfitCalculator() {
    // ---- Inputs ----
    const [sellingPrice, setSellingPrice] = useState(999);
    const [costPrice, setCostPrice] = useState(300);
    const [shippingToFBA, setShippingToFBA] = useState(50);
    const [ppcPerUnit, setPpcPerUnit] = useState(30);
    const [packaging, setPackaging] = useState(20);
    const [category, setCategory] = useState('electronics');
    const [sizeTier, setSizeTier] = useState('standard');
    const [targetUnits, setTargetUnits] = useState(100);

    // ---- Derivations ----
    const calc = useMemo(() => {
        const cat = CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
        const tier = SIZE_TIERS.find(s => s.value === sizeTier) || SIZE_TIERS[1];

        const referralFeeAmt = (sellingPrice * cat.fee) / 100;
        const gstOnFees = (referralFeeAmt + tier.fee) * 0.18;      // 18% GST on Amazon fees
        const totalAmazonFees = referralFeeAmt + tier.fee + gstOnFees;
        const totalCOGS = costPrice + shippingToFBA + ppcPerUnit + packaging;
        const totalCostPerUnit = totalCOGS + totalAmazonFees;

        const profitPerUnit = sellingPrice - totalCostPerUnit;
        const profitMargin = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;
        const roi = costPrice > 0 ? (profitPerUnit / totalCOGS) * 100 : 0;

        const monthlyRevenue = sellingPrice * targetUnits;
        const monthlyProfit = profitPerUnit * targetUnits;
        const monthlyCosts = totalCostPerUnit * targetUnits;

        // Break-even
        const breakEvenPrice = totalCostPerUnit / (1 - cat.fee / 100 - 0.18 * cat.fee / 100 - tier.fee / sellingPrice || 0.01);
        const breakEvenUnits = profitPerUnit !== 0
            ? Math.abs(Math.ceil((totalCOGS * targetUnits) / (sellingPrice - totalAmazonFees)))
            : 0;

        // Chart slices — only include positive values
        const slices = [
            { label: 'Product Cost', value: Math.max(0, costPrice), color: '#7c3aed' },
            { label: 'Amazon Fees', value: Math.max(0, totalAmazonFees), color: '#ef4444' },
            { label: 'Shipping', value: Math.max(0, shippingToFBA), color: '#3b82f6' },
            { label: 'PPC', value: Math.max(0, ppcPerUnit), color: '#f59e0b' },
            { label: 'Packaging', value: Math.max(0, packaging), color: '#8b5cf6' },
            { label: 'Profit', value: Math.max(0, profitPerUnit), color: '#10b981' },
        ].filter(s => s.value > 0);

        const grade = profitMargin >= 30 ? 'A'
            : profitMargin >= 20 ? 'B'
                : profitMargin >= 10 ? 'C'
                    : profitMargin >= 0 ? 'D'
                        : 'F';

        return {
            referralFeeAmt, gstOnFees, totalAmazonFees,
            totalCOGS, totalCostPerUnit,
            profitPerUnit, profitMargin, roi,
            monthlyRevenue, monthlyProfit, monthlyCosts,
            breakEvenPrice, breakEvenUnits,
            slices, grade, cat,
            referralPct: cat.fee, fbaFee: tier.fee,
        };
    }, [sellingPrice, costPrice, shippingToFBA, ppcPerUnit, packaging, category, sizeTier, targetUnits]);

    const isProfitable = calc.profitPerUnit > 0;
    const gradeColor = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }[calc.grade];

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <h1>💰 Profit Calculator <span style={{ fontSize: '1rem', fontWeight: 400 }}>— Amazon India FBA</span></h1>
                <p>Calculate your real profit after Amazon fees, FBA costs, and advertising spend</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>

                {/* ===== INPUT PANEL ===== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* Pricing */}
                    <div className="glass-card" style={{ padding: 22 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <DollarSign size={16} color="#7c3aed" /> Pricing
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <NumInput label="Selling Price (on Amazon)" value={sellingPrice} min={1} onChange={setSellingPrice} hint="The price customers pay on Amazon" />
                            <NumInput label="Your Cost Price (per unit)" value={costPrice} min={0} onChange={setCostPrice} hint="Manufacturing or purchase cost" />
                        </div>
                    </div>

                    {/* Amazon Settings */}
                    <div className="glass-card" style={{ padding: 22 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '1rem' }}>🛒</span> Amazon Settings
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 }}>Product Category</div>
                                <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                                    {CATEGORIES.map(c => (
                                        <option key={c.value} value={c.value}>{c.label} — {c.fee}% referral</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 }}>Product Size / FBA Tier</div>
                                <select className="input-field" value={sizeTier} onChange={e => setSizeTier(e.target.value)}>
                                    {SIZE_TIERS.map(s => (
                                        <option key={s.value} value={s.value}>{s.label} — ₹{s.fee} FBA fee</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Other Costs */}
                    <div className="glass-card" style={{ padding: 22 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '1rem' }}>📦</span> Additional Costs (per unit)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <Slider label="Shipping to FBA" value={shippingToFBA} min={0} max={500} step={5} hint="Cost to ship your inventory to Amazon warehouse" onChange={setShippingToFBA} />
                            <Slider label="PPC / Advertising" value={ppcPerUnit} min={0} max={300} step={5} hint="Estimated ad spend per unit sold" onChange={setPpcPerUnit} />
                            <Slider label="Packaging & Labelling" value={packaging} min={0} max={200} step={5} hint="Poly bags, labels, boxes, inserts" onChange={setPackaging} />
                        </div>
                    </div>

                    {/* Monthly Target */}
                    <div className="glass-card" style={{ padding: 22 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={16} color="#10b981" /> Monthly Target
                        </div>
                        <Slider label="Units sold per month" value={targetUnits} min={1} max={5000} step={10} unit="" hint="Expected monthly sales volume" onChange={setTargetUnits} />
                    </div>
                </div>

                {/* ===== RESULTS PANEL ===== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* Main Score Card */}
                    <div className="glass-card" style={{
                        padding: 28,
                        background: isProfitable ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${isProfitable ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                        <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Doughnut */}
                            <Doughnut slices={calc.slices} size={160} thickness={24} />

                            {/* Key metrics */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                                    <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '3rem', color: isProfitable ? '#10b981' : '#ef4444', lineHeight: 1 }}>
                                        {isProfitable ? '+' : ''}₹{fmt(calc.profitPerUnit)}
                                    </div>
                                    <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '2rem', color: gradeColor }}>{calc.grade}</div>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
                                    Net profit per unit · <strong style={{ color: isProfitable ? '#10b981' : '#ef4444' }}>{pct(calc.profitMargin)} margin</strong>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {[
                                        { l: 'ROI', v: pct(calc.roi), c: calc.roi >= 30 ? '#10b981' : calc.roi >= 0 ? '#f59e0b' : '#ef4444' },
                                        { l: 'Margin', v: pct(calc.profitMargin), c: gradeColor },
                                        { l: 'Revenue/unit', v: '₹' + fmt(sellingPrice), c: 'var(--text-primary)' },
                                        { l: 'Cost/unit', v: '₹' + fmt(calc.totalCostPerUnit), c: '#ef4444' },
                                    ].map(m => (
                                        <div key={m.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>{m.l}</div>
                                            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', color: m.c }}>{m.v}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="glass-card" style={{ padding: 22 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 16 }}>📊 Cost Breakdown (per unit)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { l: 'Selling Price', v: sellingPrice, color: 'var(--text-primary)', arrow: true },
                                { l: '─ Product Cost', v: -costPrice, color: '#7c3aed' },
                                { l: `─ Referral Fee (${calc.referralPct}%)`, v: -calc.referralFeeAmt, color: '#ef4444' },
                                { l: `─ FBA Fulfillment Fee`, v: -calc.fbaFee, color: '#3b82f6' },
                                { l: '─ GST on Amazon Fees (18%)', v: -calc.gstOnFees, color: '#f97316' },
                                { l: '─ Shipping to FBA', v: -shippingToFBA, color: '#06b6d4' },
                                { l: '─ PPC / Advertising', v: -ppcPerUnit, color: '#f59e0b' },
                                { l: '─ Packaging', v: -packaging, color: '#8b5cf6' },
                                { l: '= Net Profit', v: calc.profitPerUnit, color: isProfitable ? '#10b981' : '#ef4444', bold: true },
                            ].map((row, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: row.bold ? '10px 14px' : '6px 0', borderRadius: row.bold ? 10 : 0, background: row.bold ? (isProfitable ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'transparent', borderTop: row.bold ? '1px solid var(--border-subtle)' : 'none' }}>
                                    <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: row.bold ? 700 : 400 }}>{row.l}</span>
                                    <span style={{ fontFamily: 'Outfit', fontWeight: row.bold ? 800 : 600, fontSize: row.bold ? '1.1rem' : '0.9rem', color: row.color }}>
                                        {row.v >= 0 ? '₹' + fmt(row.v) : '─ ₹' + fmt(Math.abs(row.v))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monthly Projection */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                        <MetricCard label="Monthly Revenue" value={'₹' + (calc.monthlyRevenue >= 100000 ? (calc.monthlyRevenue / 100000).toFixed(1) + 'L' : Math.round(calc.monthlyRevenue).toLocaleString('en-IN'))} sub={`${targetUnits} units × ₹${sellingPrice}`} color="#7c3aed" icon={<TrendingUp size={16} />} />
                        <MetricCard label="Monthly Profit" value={'₹' + (Math.abs(calc.monthlyProfit) >= 100000 ? (calc.monthlyProfit / 100000).toFixed(1) + 'L' : Math.round(calc.monthlyProfit).toLocaleString('en-IN'))} sub={`After all costs`} color={isProfitable ? '#10b981' : '#ef4444'} icon={isProfitable ? <CheckCircle size={16} /> : <TrendingDown size={16} />} />
                        <MetricCard label="Break-even Units" value={isProfitable ? Math.ceil(calc.totalCOGS * targetUnits / Math.max(calc.profitPerUnit, 0.01)).toLocaleString('en-IN') : '—'} sub="Units needed to cover costs" color="#f59e0b" icon={<Calculator size={16} />} />
                    </div>

                    {/* Legend */}
                    <div className="glass-card" style={{ padding: 18 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 12 }}>🎨 Chart Legend</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {calc.slices.map(s => (
                                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        {s.label} — ₹{fmt(s.value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommendation */}
                    <div className="glass-card" style={{
                        padding: 20,
                        background: calc.grade === 'A' || calc.grade === 'B' ? 'rgba(16,185,129,0.08)' : calc.grade === 'F' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.07)',
                        border: `1px solid ${gradeColor}30`,
                    }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 12, color: gradeColor }}>
                            {calc.grade === 'A' ? '🚀 Excellent Opportunity!' : calc.grade === 'B' ? '✅ Solid Product Pick' : calc.grade === 'C' ? '⚠️ Marginal — Proceed Carefully' : calc.grade === 'D' ? '🔴 Low Margin — Needs Cost Reduction' : '❌ Not Profitable — Fix This First'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                calc.profitMargin < 20 && '📉 Margin below 20% — negotiate a better cost price or increase selling price.',
                                calc.referralFeeAmt > sellingPrice * 0.15 && `💡 Referral fee (${pct(calc.referralPct)}) is high — consider a lower-fee category.`,
                                ppcPerUnit > sellingPrice * 0.1 && '📢 PPC cost >10% of selling price — optimise your ad campaigns.',
                                calc.roi < 20 && '💰 ROI below 20% — compare with other investment options.',
                                calc.profitMargin >= 30 && '🏆 Margin over 30% is excellent for Amazon FBA.',
                                calc.roi >= 50 && '⭐ ROI over 50% — highly recommended product to sell.',
                            ].filter(Boolean).map((tip, i) => (
                                <div key={i} style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                                    {tip}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                input[type="range"] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); outline: none; }
                input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #7c3aed; cursor: pointer; box-shadow: 0 0 6px rgba(124,58,237,0.5); }
                input[type="number"]::-webkit-outer-spin-button,
                input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            `}</style>
        </div>
    );
}
