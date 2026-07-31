import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/input';
import Button from '../components/ui/button';
import DatePicker from '../components/ui/DatePicker';
import ImageKitUploader from '../components/ImageKitUploader';
import { User, Mail, Lock, Phone, UserPlus, AlertCircle, Shield, Eye, EyeOff, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phoneNumber: '',
    DOB: '',
    profileImage: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  // Security Regex Standards
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time security validation
    if (name === 'email') {
      if (value && !EMAIL_REGEX.test(value)) {
        setEmailError('Invalid email format (e.g. user@domain.com)');
      } else {
        setEmailError('');
      }
    }

    if (name === 'password') {
      if (value && !PASSWORD_REGEX.test(value)) {
        setPasswordError('Min 8 chars, 1 uppercase, 1 number, 1 special symbol (#, @, $, !, %, etc.)');
      } else {
        setPasswordError('');
      }
    }
  };

  const setRole = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Security Regex Verification
    if (!EMAIL_REGEX.test(formData.email)) {
      setError('Please provide a valid email address (e.g. user@store.com)');
      return;
    }

    if (!PASSWORD_REGEX.test(formData.password)) {
      setError('Password must be at least 8 characters, containing 1 uppercase, 1 number, and 1 symbol (#, @, $, !, %, etc.)');
      return;
    }

    const res = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role,
      formData.phoneNumber,
      formData.DOB,
      formData.profileImage
    );

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

  // Password rules checks for real-time visual indicator
  const hasMinLength = formData.password.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const hasSymbol = /[^A-Za-z0-9]/.test(formData.password);

  return (
    <div className="neo-auth-wrapper">
      <div className="neo-auth-container">
        {/* Left Side Hero Panel with DotLottie Animation */}
        <div className="neo-auth-hero" style={{ background: '#38bdf8' }}>
          <div className="hero-tag-badge" style={{ background: '#ffffff', color: '#0f172a' }}>
            <Sparkles size={14} style={{ marginRight: 4, display: 'inline' }} /> Instant Registration
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
            "Join SmartStore Desk as Admin or Customer in seconds"
          </div>
        </div>

        {/* Right Side Form Panel */}
        <div className="neo-auth-form-panel">
          <div>
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Register a new store user or administrator</p>
          </div>

          {/* Role Switcher Pills */}
          <div className="role-switcher">
            <button
              type="button"
              className={`role-btn ${formData.role === 'customer' ? 'active' : ''}`}
              onClick={() => setRole('customer')}
            >
              <User size={14} style={{ marginRight: 4, display: 'inline' }} /> Customer
            </button>
            <button
              type="button"
              className={`role-btn ${formData.role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              <Shield size={14} style={{ marginRight: 4, display: 'inline' }} /> Store Admin
            </button>
          </div>

          {error && (
            <div className="alert-box alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ImageKit Profile Photo Uploader */}
            <ImageKitUploader
              label="Profile Photo (Powered by ImageKit)"
              currentImage={formData.profileImage}
              onUploadSuccess={(url) => setFormData({ ...formData, profileImage: url })}
            />

            <Input
              label="Full Name"
              type="text"
              name="name"
              icon={User}
              placeholder="e.g. Sahitya Ghosh"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              icon={Mail}
              placeholder="e.g. user@store.com"
              value={formData.email}
              onChange={handleChange}
              error={emailError}
              required
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                icon={Lock}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={passwordError}
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

            {/* Real-time Security Checklist */}
            {formData.password && (
              <div className="password-security-checklist">
                <span className={hasMinLength ? 'valid' : 'invalid'}>
                  {hasMinLength ? <CheckCircle2 size={12} /> : <XCircle size={12} />} 8+ Chars
                </span>
                <span className={hasUpper ? 'valid' : 'invalid'}>
                  {hasUpper ? <CheckCircle2 size={12} /> : <XCircle size={12} />} 1 Uppercase
                </span>
                <span className={hasNumber ? 'valid' : 'invalid'}>
                  {hasNumber ? <CheckCircle2 size={12} /> : <XCircle size={12} />} 1 Number
                </span>
                <span className={hasSymbol ? 'valid' : 'invalid'}>
                  {hasSymbol ? <CheckCircle2 size={12} /> : <XCircle size={12} />} 1 Symbol (#, @, $, !, %, etc.)
                </span>
              </div>
            )}

            <div className="form-grid-2col" style={{ marginTop: 12 }}>
              <Input
                label="Phone Number"
                type="text"
                name="phoneNumber"
                icon={Phone}
                placeholder="8777099335"
                value={formData.phoneNumber}
                onChange={handleChange}
              />

              {/* Custom Dark DatePicker */}
              <DatePicker
                label="Date of Birth"
                value={formData.DOB}
                onChange={(dobValue) => setFormData({ ...formData, DOB: dobValue })}
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="shadcn-btn-primary w-100"
              style={{ width: '100%', marginTop: 8 }}
            >
              <UserPlus size={18} /> Create Account
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.95rem', fontWeight: 700 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0f172a', textDecoration: 'underline' }}>
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
