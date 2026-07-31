import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  LogOut,
  User,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const hasValidAvatar = user?.profileImage && !user.profileImage.startsWith('blob:');

  return (
    <nav className="neo-navbar">
      <div className="nav-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <div className="brand-badge">
            <Store size={20} color="#ffffff" />
          </div>
          <span>SmartStore<span style={{ color: '#ffffff' }}>.POS</span></span>
        </Link>

        {/* Desktop Menu */}
        <div className="desktop-menu">
          {user ? (
            <>
              {user.role === 'admin' ? (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                  >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/admin/billing"
                    className={`nav-link ${isActive('/admin/billing') ? 'active' : ''}`}
                  >
                    <Receipt size={18} />
                    <span>Billing Desk</span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/store"
                  className={`nav-link ${isActive('/store') ? 'active' : ''}`}
                >
                  <ShoppingBag size={18} />
                  <span>Browse Store</span>
                </Link>
              )}

              <div className="user-pill" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px' }}>
                {hasValidAvatar ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #0f172a' }}
                  />
                ) : (
                  user.role === 'admin' ? <ShieldCheck size={16} /> : <User size={16} />
                )}
                <span>{user.name}</span>
              </div>

              <button onClick={handleLogout} className="shadcn-btn shadcn-btn-secondary" style={{ padding: '8px 14px' }}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>
                Sign In
              </Link>
              <Link to="/register" className="shadcn-btn shadcn-btn-primary" style={{ padding: '8px 18px' }}>
                Create Account
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          {user ? (
            <>
              {user.role === 'admin' ? (
                <>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                  >
                    <LayoutDashboard size={18} /> Dashboard
                  </Link>
                  <Link
                    to="/admin/billing"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`nav-link ${isActive('/admin/billing') ? 'active' : ''}`}
                  >
                    <Receipt size={18} /> Billing Desk
                  </Link>
                </>
              ) : (
                <Link
                  to="/store"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-link ${isActive('/store') ? 'active' : ''}`}
                >
                  <ShoppingBag size={18} /> Browse Store
                </Link>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="shadcn-btn shadcn-btn-danger mt-2"
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-link"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="shadcn-btn shadcn-btn-primary mt-2"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
