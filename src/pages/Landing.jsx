import { useNavigate } from 'react-router-dom';
import {
    Search, TrendingUp, Key, RefreshCw, Star, Zap, BarChart2,
    Globe, CheckCircle, ArrowRight, Users, Target, Shield
} from 'lucide-react';
import './Landing.css';

const features = [
    {
        icon: Search,
        color: '#7c3aed',
        shadow: 'rgba(124,58,237,0.4)',
        title: 'ASIN Research (Xray)',
        desc: 'Instantly analyze any Amazon product — estimated sales, revenue, BSR, review counts, and historic performance in one click.',
        tag: 'Product Intelligence',
    },
    {
        icon: TrendingUp,
        color: '#10b981',
        shadow: 'rgba(16,185,129,0.4)',
        title: 'Trend History (Trendster)',
        desc: 'Visualize 12-month BSR history, price fluctuations, seasonality patterns, and product lifecycle stages at a glance.',
        tag: 'Market Trends',
    },
    {
        icon: Key,
        color: '#3b82f6',
        shadow: 'rgba(59,130,246,0.4)',
        title: 'Keyword Research (Magnet)',
        desc: 'Discover high-volume, low-competition keywords that drive real traffic. See search volume trends and CPC data.',
        tag: 'Keyword Intel',
    },
    {
        icon: RefreshCw,
        color: '#f59e0b',
        shadow: 'rgba(245,158,11,0.4)',
        title: 'Reverse ASIN (Cerebro)',
        desc: "See every keyword a competitor's product ranks for — organically and through sponsored ads. Steal their traffic.",
        tag: 'Competitor Analysis',
    },
    {
        icon: Star,
        color: '#ec4899',
        shadow: 'rgba(236,72,153,0.4)',
        title: 'Product Score',
        desc: 'Get AI-powered product health scores based on sales momentum, review velocity, competition density, and keyword growth.',
        tag: 'AI Scoring',
    },
    {
        icon: BarChart2,
        color: '#06b6d4',
        shadow: 'rgba(6,182,212,0.4)',
        title: 'Market Dashboard',
        desc: 'Monitor entire categories, track BSR movers, and spot emerging trends before your competitors even notice.',
        tag: 'Market Overview',
    },
];

const plans = [
    {
        name: 'Starter',
        price: '29',
        color: 'var(--accent-blue)',
        gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
        features: ['50 ASIN lookups/month', 'BSR History (3 months)', 'Basic Keyword Research', '1 User', 'Email Support'],
        cta: 'Start Free Trial',
        popular: false,
    },
    {
        name: 'Pro',
        price: '79',
        color: 'var(--accent-purple)',
        gradient: 'var(--gradient-primary)',
        features: ['Unlimited ASIN lookups', 'Full BSR History (24 months)', 'Advanced Keyword Research', 'Reverse ASIN (Cerebro)', 'Product Score AI', '5 Users', 'Priority Support'],
        cta: 'Get Pro',
        popular: true,
    },
    {
        name: 'Enterprise',
        price: '249',
        color: 'var(--accent-green)',
        gradient: 'var(--gradient-green)',
        features: ['Everything in Pro', 'Bulk ASIN Analysis', 'API Access', 'Custom Reports', 'White-label Option', 'Unlimited Users', 'Dedicated Account Manager'],
        cta: 'Contact Sales',
        popular: false,
    },
];

const stats = [
    { value: '2.4M+', label: 'Products Tracked', icon: Globe },
    { value: '98K+', label: 'Active Sellers', icon: Users },
    { value: '14.3B+', label: 'Data Points', icon: Target },
    { value: '99.9%', label: 'Uptime SLA', icon: Shield },
];

const testimonials = [
    {
        name: 'Rahul Sharma',
        role: 'Amazon FBA Seller · ₹2.4Cr/year',
        avatar: '👨‍💼',
        text: "TrendSpy completely changed how I find products. I spotted the pet grooming vacuum trend 3 months before it exploded. Made ₹18L profit in 60 days.",
        rating: 5,
    },
    {
        name: 'Priya Mehta',
        role: 'Brand Owner · 7-figure seller',
        avatar: '👩‍💻',
        text: "The Reverse ASIN feature alone is worth 10x the subscription price. I found 200 keywords my competitor ranked for that I was missing completely.",
        rating: 5,
    },
    {
        name: 'David Chen',
        role: 'Product Researcher & Consultant',
        avatar: '👨‍🔬',
        text: "Finally a tool that actually shows you WHERE the trend is going, not just where it's been. The BSR history charts are incredibly detailed.",
        rating: 5,
    },
];

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="landing">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="nav-container">
                    <div className="nav-logo">
                        <div className="logo-icon"><Zap size={18} /></div>
                        <span className="logo-text">TrendSpy</span>
                    </div>
                    <div className="nav-links">
                        <a href="#features" className="btn-ghost">Features</a>
                        <a href="#pricing" className="btn-ghost">Pricing</a>
                        <a href="#testimonials" className="btn-ghost">Testimonials</a>
                    </div>
                    <div className="nav-actions">
                        <button className="btn-outline" onClick={() => navigate('/login')}>Log In</button>
                        <button className="btn-primary" onClick={() => navigate('/signup')}>
                            Get Started <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero-section">
                <div className="hero-orbs">
                    <div className="glow-orb" style={{ width: 600, height: 600, background: 'rgba(124,58,237,0.15)', top: -200, left: -200 }} />
                    <div className="glow-orb" style={{ width: 400, height: 400, background: 'rgba(236,72,153,0.1)', top: 100, right: -100 }} />
                </div>
                <div className="hero-content">
                    <div className="hero-badge">
                        <Zap size={14} />
                        <span>The #1 Amazon Intelligence Platform</span>
                    </div>
                    <h1 className="hero-title">
                        Find Winning Products<br />
                        <span className="gradient-text">Before Your Competitors Do</span>
                    </h1>
                    <p className="hero-subtitle">
                        TrendSpy gives you real-time Amazon product data, BSR trend history, keyword intelligence, and AI-powered scoring — everything you need to dominate your niche.
                    </p>
                    <div className="hero-cta">
                        <button className="btn-primary hero-btn" onClick={() => navigate('/signup')}>
                            <Zap size={18} /> Start Free Trial — No Credit Card
                        </button>
                        <button className="btn-outline hero-btn" onClick={() => navigate('/dashboard')}>
                            View Live Demo <ArrowRight size={16} />
                        </button>
                    </div>
                    <p className="hero-social-proof">
                        <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} />
                        Trusted by <strong>98,000+</strong> Amazon sellers worldwide
                    </p>
                </div>

                {/* Hero Dashboard Preview */}
                <div className="hero-preview">
                    <div className="preview-card">
                        <div className="preview-header">
                            <span className="preview-dot red" /><span className="preview-dot yellow" /><span className="preview-dot green" />
                            <span className="preview-url">app.trendspy.io/dashboard/research</span>
                        </div>
                        <div className="preview-body">
                            <div className="preview-top-bar">
                                <div className="preview-search-bar">
                                    <Search size={14} />
                                    <span>B0BVXQKTFW</span>
                                </div>
                                <div className="preview-btn-sm">Analyze</div>
                            </div>
                            <div className="preview-stats-row">
                                {[
                                    { label: 'Est. Sales/mo', color: '#7c3aed', value: '8,900' },
                                    { label: 'Revenue/mo', color: '#10b981', value: '$266K' },
                                    { label: 'BSR', color: '#3b82f6', value: '#56' },
                                    { label: 'Score', color: '#f59e0b', value: '94/100' },
                                ].map(s => (
                                    <div key={s.label} className="preview-stat">
                                        <div className="preview-stat-value" style={{ color: s.color }}>{s.value}</div>
                                        <div className="preview-stat-label">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="preview-chart">
                                {[40, 55, 48, 70, 62, 80, 75, 90, 85, 95, 88, 100].map((h, i) => (
                                    <div key={i} className="preview-bar" style={{ height: h + '%', opacity: 0.5 + i * 0.04 }} />
                                ))}
                            </div>
                            <div className="preview-table-row">
                                <div className="preview-cell bold">Insulated Bottle 40oz</div>
                                <div className="preview-cell green">↑ 31%</div>
                                <div className="preview-cell">#56 BSR</div>
                                <div className="preview-cell">22,100 ⭐</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats bar */}
            <section className="stats-bar">
                <div className="stats-container">
                    {stats.map(({ value, label, icon: Icon }) => (
                        <div key={label} className="stat-item">
                            <div className="stat-icon"><Icon size={20} /></div>
                            <div className="stat-value">{value}</div>
                            <div className="stat-label">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="features-section" id="features">
                <div className="section-container">
                    <div className="section-center">
                        <div className="badge badge-purple">Platform Tools</div>
                        <h2 className="section-title" style={{ marginTop: 16 }}>
                            Every Tool You Need to<br />
                            <span className="gradient-text">Win on Amazon</span>
                        </h2>
                        <p className="section-subtitle" style={{ margin: '0 auto 60px' }}>
                            From product discovery to keyword domination — TrendSpy has a dedicated tool for every stage of your research workflow.
                        </p>
                    </div>
                    <div className="features-grid">
                        {features.map((f) => (
                            <div key={f.title} className="feature-card glass-card">
                                <div className="feature-icon" style={{ background: f.color + '22', boxShadow: `0 0 20px ${f.shadow}` }}>
                                    <f.icon size={22} style={{ color: f.color }} />
                                </div>
                                <div className="badge badge-purple" style={{ fontSize: '0.7rem', marginBottom: 10 }}>{f.tag}</div>
                                <h3 className="feature-title">{f.title}</h3>
                                <p className="feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="pricing-section" id="pricing">
                <div className="section-container">
                    <div className="section-center">
                        <div className="badge badge-purple">Simple Pricing</div>
                        <h2 className="section-title" style={{ marginTop: 16 }}>
                            Invest in Your <span className="gradient-text">Amazon Success</span>
                        </h2>
                        <p className="section-subtitle" style={{ margin: '0 auto 60px' }}>
                            Start free. Scale as you grow. No hidden fees.
                        </p>
                    </div>
                    <div className="pricing-grid">
                        {plans.map((plan) => (
                            <div key={plan.name} className={`pricing-card glass-card ${plan.popular ? 'popular' : ''}`}>
                                {plan.popular && (
                                    <div className="popular-badge">
                                        <Zap size={12} /> Most Popular
                                    </div>
                                )}
                                <div className="plan-header">
                                    <div className="plan-icon" style={{ background: plan.gradient }}>
                                        <Star size={18} />
                                    </div>
                                    <h3 className="plan-name">{plan.name}</h3>
                                    <div className="plan-price">
                                        <span className="plan-currency">$</span>
                                        <span className="plan-amount">{plan.price}</span>
                                        <span className="plan-period">/mo</span>
                                    </div>
                                </div>
                                <ul className="plan-features">
                                    {plan.features.map(f => (
                                        <li key={f}>
                                            <CheckCircle size={15} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    className={plan.popular ? 'btn-primary' : 'btn-outline'}
                                    style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                                    onClick={() => navigate('/signup')}
                                >
                                    {plan.cta} {plan.popular && <ArrowRight size={15} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials-section" id="testimonials">
                <div className="section-container">
                    <div className="section-center">
                        <div className="badge badge-purple">Success Stories</div>
                        <h2 className="section-title" style={{ marginTop: 16 }}>
                            Sellers <span className="gradient-text">Love TrendSpy</span>
                        </h2>
                        <p className="section-subtitle" style={{ margin: '0 auto 60px' }}>
                            Don't take our word for it — hear from sellers who found their winning products.
                        </p>
                    </div>
                    <div className="testimonials-grid">
                        {testimonials.map((t) => (
                            <div key={t.name} className="testimonial-card glass-card">
                                <div className="testimonial-stars">
                                    {'★'.repeat(t.rating)}
                                </div>
                                <p className="testimonial-text">"{t.text}"</p>
                                <div className="testimonial-author">
                                    <div className="testimonial-avatar">{t.avatar}</div>
                                    <div>
                                        <div className="testimonial-name">{t.name}</div>
                                        <div className="testimonial-role">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-orb" />
                <div className="cta-content">
                    <h2 className="section-title">
                        Ready to Find Your<br />
                        <span className="gradient-text">Next Winning Product?</span>
                    </h2>
                    <p className="section-subtitle" style={{ margin: '16px auto 40px' }}>
                        Join 98,000+ sellers who use TrendSpy to research smarter and grow faster.
                    </p>
                    <div className="hero-cta">
                        <button className="btn-primary hero-btn" onClick={() => navigate('/signup')}>
                            <Zap size={18} /> Start Free — 14 Days Trial
                        </button>
                        <button className="btn-outline hero-btn" onClick={() => navigate('/dashboard')}>
                            Explore Dashboard
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-container">
                    <div className="footer-logo">
                        <div className="logo-icon"><Zap size={16} /></div>
                        <span className="logo-text">TrendSpy</span>
                    </div>
                    <p className="footer-desc">The smarter way to find winning Amazon products.</p>
                    <div className="footer-links">
                        <a href="#">Privacy</a>
                        <a href="#">Terms</a>
                        <a href="#">Contact</a>
                        <a href="#">Blog</a>
                    </div>
                    <p className="footer-copy">© 2025 TrendSpy. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
