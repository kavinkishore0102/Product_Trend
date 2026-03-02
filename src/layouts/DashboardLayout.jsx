import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
    LayoutDashboard, Search, TrendingUp, Key, RefreshCw,
    Star, Bell, Settings, LogOut, ChevronLeft, ChevronRight,
    Zap, User, Menu, X
} from 'lucide-react';
import './DashboardLayout.css';

const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/research', label: 'ASIN Research', icon: Search },
    { to: '/dashboard/trends', label: 'Trend History', icon: TrendingUp },
    { to: '/dashboard/keywords', label: 'Keyword Research', icon: Key },
    { to: '/dashboard/cerebro', label: 'Reverse ASIN', icon: RefreshCw },
    { to: '/dashboard/score', label: 'Product Score', icon: Star },
];

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="dashboard-shell">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo" onClick={() => navigate('/')}>
                        <div className="logo-icon"><Zap size={18} /></div>
                        {!collapsed && <span className="logo-text">TrendSpy</span>}
                    </div>
                    <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <div className="sidebar-section-label">{!collapsed && 'TOOLS'}</div>

                <nav className="sidebar-nav">
                    {navItems.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                            title={collapsed ? label : ''}
                        >
                            <Icon size={18} />
                            {!collapsed && <span>{label}</span>}
                            {!collapsed && <div className="nav-item-indicator" />}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <NavLink to="/dashboard" className="nav-item" title={collapsed ? 'Settings' : ''}>
                        <Settings size={18} />
                        {!collapsed && <span>Settings</span>}
                    </NavLink>
                    <button className="nav-item logout-btn" onClick={() => navigate('/')} title={collapsed ? 'Logout' : ''}>
                        <LogOut size={18} />
                        {!collapsed && <span>Log Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main area */}
            <div className="dashboard-main">
                {/* Top Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div className="header-search">
                            <Search size={16} />
                            <input placeholder="Search ASIN, keyword, or product…" className="header-search-input" />
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="badge badge-purple" style={{ animation: 'pulse-glow 2s infinite' }}>
                            <Zap size={12} /> Pro Plan
                        </div>
                        <button className="header-icon-btn">
                            <Bell size={18} />
                            <span className="notif-dot" />
                        </button>
                        <div className="header-avatar">
                            <User size={16} />
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
