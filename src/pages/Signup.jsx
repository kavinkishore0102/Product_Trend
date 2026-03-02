import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import './Auth.css';

const perks = [
    'Unlimited ASIN lookups',
    'Full 24-month BSR history',
    'Reverse ASIN (Cerebro)',
    'Keyword trend intelligence',
    'AI Product Score',
];

export default function Signup() {
    const navigate = useNavigate();
    const [show, setShow] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/dashboard');
    };

    return (
        <div className="auth-page signup-page">
            <div className="auth-orb left" />
            <div className="auth-orb right" />

            {/* Left pane */}
            <div className="signup-left">
                <div className="auth-logo" onClick={() => navigate('/')}>
                    <div className="logo-icon"><Zap size={18} /></div>
                    <span className="logo-text">TrendSpy</span>
                </div>
                <h2 className="signup-left-title">
                    Start your <span className="gradient-text">14-day free trial</span> today
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 28 }}>
                    No credit card required. Cancel anytime. Instant access to all Pro features.
                </p>
                <ul className="perk-list">
                    {perks.map(p => (
                        <li key={p}>
                            <CheckCircle size={18} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                            {p}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Right pane / form */}
            <div className="auth-card glass-card">
                <h1 className="auth-title">Create Your Account</h1>
                <p className="auth-subtitle">Join 98,000+ sellers already using TrendSpy</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-wrap">
                            <User size={16} className="input-icon" />
                            <input
                                className="input-field"
                                type="text"
                                placeholder="John Smith"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrap">
                            <Mail size={16} className="input-icon" />
                            <input
                                className="input-field"
                                type="email"
                                placeholder="your@email.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrap">
                            <Lock size={16} className="input-icon" />
                            <input
                                className="input-field"
                                type={show ? 'text' : 'password'}
                                placeholder="Min 8 characters"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                style={{ paddingLeft: 40, paddingRight: 40 }}
                            />
                            <button type="button" className="eye-btn" onClick={() => setShow(!show)}>
                                {show ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary auth-submit">
                        <Zap size={16} /> Create Free Account
                    </button>
                    <p className="auth-terms">
                        By signing up, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
                    </p>
                </form>

                <div className="auth-divider"><span>or sign up with</span></div>
                <div className="auth-socials">
                    <button className="social-btn">🌐 Google</button>
                    <button className="social-btn">🍎 Apple</button>
                </div>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <button onClick={() => navigate('/login')} className="switch-link">Sign in</button>
                </p>
            </div>
        </div>
    );
}
