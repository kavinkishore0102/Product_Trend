import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function Login() {
    const navigate = useNavigate();
    const [show, setShow] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/dashboard');
    };

    return (
        <div className="auth-page">
            <div className="auth-orb left" />
            <div className="auth-orb right" />

            <div className="auth-card glass-card">
                <div className="auth-logo" onClick={() => navigate('/')}>
                    <div className="logo-icon"><Zap size={18} /></div>
                    <span className="logo-text">TrendSpy</span>
                </div>
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to your account to continue</p>

                <form onSubmit={handleSubmit} className="auth-form">
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
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                style={{ paddingLeft: 40, paddingRight: 40 }}
                            />
                            <button type="button" className="eye-btn" onClick={() => setShow(!show)}>
                                {show ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-footer-row">
                        <label className="remember-label">
                            <input type="checkbox" /> Remember me
                        </label>
                        <a href="#" className="forgot-link">Forgot password?</a>
                    </div>

                    <button type="submit" className="btn-primary auth-submit">
                        Sign In <ArrowRight size={16} />
                    </button>
                </form>

                <div className="auth-divider"><span>or continue with</span></div>
                <div className="auth-socials">
                    <button className="social-btn">🌐 Google</button>
                    <button className="social-btn">🍎 Apple</button>
                </div>

                <p className="auth-switch">
                    Don't have an account?{' '}
                    <button onClick={() => navigate('/signup')} className="switch-link">Sign up free</button>
                </p>
            </div>
        </div>
    );
}
