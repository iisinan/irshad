import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Input Component ────────────────────────────────────── */
const FormField = ({ label, type = 'text', placeholder, value, onChange, hint }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <label className="auth-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="auth-input"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{
              position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center',
            }}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {hint && <p style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>{hint}</p>}
    </div>
  );
};

/* ─── Divider ────────────────────────────────────────────── */
const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    <span style={{ color: 'var(--text-light)', fontSize: '0.82rem', fontWeight: 600 }}>{label}</span>
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
  </div>
);

/* ─── Login Page ─────────────────────────────────────────── */
export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const res = await login({ email, password });
    if (res.success) {
      navigate('/portfolio');
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo-icon.jpg"
            alt="Irshad"
            style={{
              height: '72px',
              width: '72px',
              objectFit: 'contain',
              margin: '0 auto 20px',
              display: 'block',
              borderRadius: '50%',
              boxShadow: '0 4px 20px rgba(26,92,53,0.14)',
            }}
          />
          <h1 style={{ fontSize: '1.9rem', fontWeight: '800', marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.97rem' }}>Log in to your Irshad account.</p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <FormField
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <FormField
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #f87171' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              Remember me
            </label>
            <Link to="/forgot" style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          <button onClick={handleLogin} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '4px', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <Divider label="or continue with" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {['Google', 'Apple'].map(provider => (
              <button key={provider} className="btn-secondary" style={{ justifyContent: 'center', padding: '11px' }}>
                {provider}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '24px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
};

/* ─── Register Page ──────────────────────────────────────── */
export const RegisterPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    setError('');
    setLoading(true);
    
    const res = await register({ 
      first_name: firstName, 
      last_name: lastName, 
      email, 
      password,
      password_confirmation: password // Laravel expects this
    });
    
    if (res.success) {
      navigate('/portfolio');
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in" style={{ maxWidth: '520px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.png"
            alt="Irshad"
            style={{ height: '80px', width: 'auto', margin: '0 auto 20px', display: 'block' }}
          />
          <h1 style={{ fontSize: '1.9rem', fontWeight: '800', marginBottom: '6px' }}>Create account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.97rem' }}>Start investing the halal way — it's free.</p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField label="First Name" placeholder="Omar" value={firstName} onChange={e => setFirstName(e.target.value)} />
            <FormField label="Last Name" placeholder="Bello" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>

          <FormField
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <FormField
            label="Password"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            hint="At least 8 characters with a number and a symbol."
          />

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: '3px', accentColor: 'var(--primary)', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.87rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              I agree to the{' '}
              <Link to="/terms" style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms of Service</Link>,{' '}
              <Link to="/privacy" style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</Link>, and
              acknowledge the{' '}
              <Link to="/shariah" style={{ color: 'var(--primary)', fontWeight: 600 }}>Shariah Methodology</Link>.
            </span>
          </label>

          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #f87171' }}>{error}</div>}

          <button onClick={handleRegister} disabled={!agreed || loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '4px', fontSize: '1rem', opacity: (agreed && !loading) ? 1 : 0.55 }}>
            {loading ? 'Creating Account...' : 'Create My Account'}
          </button>

          <Divider label="or sign up with" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {['Google', 'Apple'].map(provider => (
              <button key={provider} className="btn-secondary" style={{ justifyContent: 'center', padding: '11px' }}>
                {provider}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '24px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};
