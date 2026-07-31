import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/input';
import Button from '../components/ui/button';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await login(email, password);
    if (res.success) {
      if (res.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/store');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="neo-auth-wrapper">
      <div className="neo-auth-container">
        {/* Left Side Hero Panel with DotLottie Animation */}
        <div className="neo-auth-hero">
          <div className="hero-tag-badge">
            <Sparkles size={14} style={{ marginRight: 4, display: 'inline' }} /> Smart POS Desk
          </div>

          <div className="hero-gif-container">
            <DotLottieReact
              src="https://lottie.host/43bfe045-e4e0-4551-bb82-0bae8a69bd81/rddCAwWaVL.json"
              loop
              autoplay
              style={{
                width: '100%',
                maxHeight: '280px',
                background: '#ffffff',
                border: '3px solid #0f172a',
                borderRadius: '16px',
                boxShadow: '6px 6px 0px #0f172a',
              }}
            />
          </div>

          <div className="hero-quote">
            "Manage your store inventory & billing desk with speed"
          </div>
        </div>

        {/* Right Side Form Panel */}
        <div className="neo-auth-form-panel">
          <div>
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Enter your store account credentials</p>
          </div>

          {error && (
            <div className="alert-box alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="e.g. user@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: 36,
                  background: 'none',
                  border: 'none',
                  color: '#0f172a',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="shadcn-btn-primary w-100"
              style={{ width: '100%', marginTop: 8 }}
            >
              <LogIn size={18} /> Sign In to POS
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 28, fontSize: '0.95rem', fontWeight: 700 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#0f172a', textDecoration: 'underline' }}>
              Signup Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
