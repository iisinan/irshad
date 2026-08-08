import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/* ─── Input Component ────────────────────────────────────── */
const FormField = ({ label, name, type = 'text', placeholder, value, onChange, hint, required, minLength }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <label className="auth-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
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
      {hint && <p style={{ color: 'var(--text-light)', fontSize: '0.7rem' }}>{hint}</p>}
    </div>
  );
};

/* ─── Divider ────────────────────────────────────────────── */
const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    <span style={{ color: 'var(--text-light)', fontSize: '0.72rem', fontWeight: 600 }}>{label}</span>
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
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    const res = await loginWithGoogle(credentialResponse.credential);
    if (res.success) {
      navigate('/portfolio');
    } else {
      setError(res.error || 'Google login failed');
    }
    setLoading(false);
  };

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
            src="/logo.svg"
            alt="Irshad"
            style={{
              height: '72px',
              width: 'auto',
              objectFit: 'contain',
              margin: '0 auto 20px',
              display: 'block',
              filter: 'drop-shadow(0 4px 20px rgba(201,168,76,0.14))',
            }}
          />
          <h1 style={{ fontSize: '1.67rem', fontWeight: '800', marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Log in to your Irshad account.</p>
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

          {error && <div style={{ background: 'var(--non-halal-bg)', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.79rem', border: '1px solid #f87171' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.79rem', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              Remember me
            </label>
            <Link to="/forgot" style={{ color: 'var(--primary)', fontSize: '0.79rem', fontWeight: 600, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          <button onClick={handleLogin} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '4px', fontSize: '0.88rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <Divider label="or continue with" />

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed or was canceled.')}
              useOneTap
              theme="outline"
              shape="rectangular"
              text="continue_with"
            />
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.79rem', marginTop: '24px' }}>
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
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [investorType, setInvestorType] = useState('Retail Investor');
  const [primaryUseCase, setPrimaryUseCase] = useState('Personal Wealth Growth');
  const [investmentExperience, setInvestmentExperience] = useState('Novice (Just Starting)');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    const res = await loginWithGoogle(credentialResponse.credential);
    if (res.success) {
      navigate('/portfolio');
    } else {
      setError(res.error || 'Google signup failed');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const fname = formData.get('firstName') || firstName;
    const lname = formData.get('lastName') || lastName;
    const em = formData.get('email') || email;
    const pass = formData.get('password') || password;
    const passConfirm = formData.get('passwordConfirmation') || passwordConfirmation;

    const res = await register({ 
      name: `${fname} ${lname}`.trim(),
      email: em, 
      password: pass,
      password_confirmation: passConfirm,
      phone_number: phoneNumber,
      location: country,
      investor_type: investorType,
      primary_use_case: primaryUseCase,
      investment_experience: investmentExperience,
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
      <div className="auth-card animate-fade-in" style={{ maxWidth: '560px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.svg"
            alt="Irshad"
            style={{ height: '80px', width: 'auto', margin: '0 auto 20px', display: 'block' }}
          />
          <h1 style={{ fontSize: '1.67rem', fontWeight: '800', marginBottom: '6px' }}>Create account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Start investing the halal way — it's free.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField label="First Name *" name="firstName" placeholder="Omar" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            <FormField label="Last Name *" name="lastName" placeholder="Bello" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>

          <FormField
            label="Email Address *"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField label="Phone Number" name="phoneNumber" placeholder="+234 800 000 0000" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <label className="auth-label">Country of Residence</label>
              <select name="country" className="auth-input" value={country} onChange={e => setCountry(e.target.value)}>
                <option value="Nigeria">Nigeria 🇳🇬</option>
                <option value="Benin">Benin 🇧🇯</option>
                <option value="Burkina Faso">Burkina Faso 🇧🇫</option>
                <option value="Cape Verde">Cape Verde 🇨🇻</option>
                <option value="Côte d'Ivoire">Côte d'Ivoire 🇨🇮</option>
                <option value="Gambia">Gambia 🇬🇲</option>
                <option value="Ghana">Ghana 🇬🇭</option>
                <option value="Guinea">Guinea 🇬🇳</option>
                <option value="Guinea-Bissau">Guinea-Bissau 🇬🇼</option>
                <option value="Liberia">Liberia 🇱🇷</option>
                <option value="Mali">Mali 🇲🇱</option>
                <option value="Niger">Niger 🇳🇪</option>
                <option value="Senegal">Senegal 🇸🇳</option>
                <option value="Sierra Leone">Sierra Leone 🇸🇱</option>
                <option value="Togo">Togo 🇹🇬</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <label className="auth-label">Investor Type</label>
              <select name="investorType" className="auth-input" value={investorType} onChange={e => setInvestorType(e.target.value)}>
                <option value="Retail Investor">Retail Investor</option>
                <option value="Institutional Manager">Institutional Manager</option>
                <option value="Islamic Finance Scholar / Expert">Islamic Finance Scholar / Expert</option>
                <option value="Academic / Researcher">Academic / Researcher</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <label className="auth-label">Primary Use Case</label>
              <select name="primaryUseCase" className="auth-input" value={primaryUseCase} onChange={e => setPrimaryUseCase(e.target.value)}>
                <option value="Personal Wealth Growth">Personal Wealth Growth</option>
                <option value="Halal Portfolio Compliance">Halal Portfolio Compliance</option>
                <option value="Client Advisory Services">Client Advisory Services</option>
                <option value="Zakat Calculation & Cleansing">Zakat Calculation & Cleansing</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <label className="auth-label">Investment Experience</label>
            <select name="investmentExperience" className="auth-input" value={investmentExperience} onChange={e => setInvestmentExperience(e.target.value)}>
              <option value="Novice (Just Starting)">Novice (Just Starting)</option>
              <option value="Competent (Casual Investor)">Competent (Casual Investor)</option>
              <option value="Proficient (Active Trader)">Proficient (Active Trader)</option>
              <option value="Expert (Professional)">Expert (Professional)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField
              label="Password *"
              name="password"
              type="password"
              placeholder="Strong password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              hint="8+ chars (mix of uppercase, lowercase, numbers, symbols)."
              required
              minLength={8}
            />
            <FormField
              label="Confirm Password *"
              name="passwordConfirmation"
              type="password"
              placeholder="Confirm password"
              value={passwordConfirmation}
              onChange={e => setPasswordConfirmation(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: '3px', accentColor: 'var(--primary)', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.77rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              I agree to the{' '}
              <Link to="/terms" style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms of Service</Link>,{' '}
              <Link to="/privacy" style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</Link>, and
              acknowledge the{' '}
              <Link to="/shariah" style={{ color: 'var(--primary)', fontWeight: 600 }}>Shariah Methodology</Link>.
            </span>
          </label>

          {error && <div style={{ background: 'var(--non-halal-bg)', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.79rem', border: '1px solid #f87171' }}>{error}</div>}

          <button type="submit" disabled={!agreed || loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '4px', fontSize: '0.88rem', opacity: (agreed && !loading) ? 1 : 0.55 }}>
            {loading ? 'Creating Account...' : 'Create My Account'}
          </button>

          <Divider label="or sign up with" />

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google signup failed or was canceled.')}
              useOneTap
              theme="outline"
              shape="rectangular"
              text="signup_with"
            />
          </div>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.79rem', marginTop: '24px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

/* ─── Forgot Password Page ───────────────────────────────── */
export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const res = await api.post('/forgot-password', { email });
      setMessage(res.data?.message || 'If an account exists, a password reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Network error. Please try again later.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.svg"
            alt="Irshad"
            style={{
              height: '72px',
              width: 'auto',
              objectFit: 'contain',
              margin: '0 auto 20px',
              display: 'block',
              filter: 'drop-shadow(0 4px 20px rgba(201,168,76,0.14))',
            }}
          />
          <h1 style={{ fontSize: '1.67rem', fontWeight: '800', marginBottom: '6px' }}>Reset Password</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Enter your email to receive a reset link.</p>
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

          {error && <div style={{ background: 'var(--non-halal-bg)', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.79rem', border: '1px solid #f87171' }}>{error}</div>}
          {message && <div style={{ background: 'var(--halal-bg)', color: '#059669', padding: '12px', borderRadius: '8px', fontSize: '0.79rem', border: '1px solid #6ee7b7' }}>{message}</div>}

          <button onClick={handleSubmit} disabled={loading || !email} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '4px', fontSize: '0.88rem', opacity: (loading || !email) ? 0.7 : 1 }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.79rem', marginTop: '24px' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

/* ─── Reset Password Page ────────────────────────────────── */
export const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(window.location.search);
  const email = queryParams.get('email');
  const token = queryParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await api.post('/reset-password', { email, token, password, password_confirmation: passwordConfirmation });
      setMessage('Password successfully reset! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token.');
    }
    setLoading(false);
  };

  if (!email || !token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card animate-fade-in" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.32rem', fontWeight: '800', color: '#dc2626', marginBottom: '12px' }}>Invalid Link</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>The password reset link is invalid or missing required parameters.</p>
          <Link to="/forgot" className="btn-primary" style={{ display: 'inline-flex', padding: '12px 24px' }}>Request New Link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.svg"
            alt="Irshad"
            style={{
              height: '72px',
              width: 'auto',
              objectFit: 'contain',
              margin: '0 auto 20px',
              display: 'block',
              filter: 'drop-shadow(0 4px 20px rgba(201,168,76,0.14))',
            }}
          />
          <h1 style={{ fontSize: '1.67rem', fontWeight: '800', marginBottom: '6px' }}>Create New Password</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Please enter your new password below.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <FormField
            label="New Password"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <FormField
            label="Confirm Password"
            type="password"
            placeholder="Repeat your new password"
            value={passwordConfirmation}
            onChange={e => setPasswordConfirmation(e.target.value)}
          />

          {error && <div style={{ background: 'var(--non-halal-bg)', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.79rem', border: '1px solid #f87171' }}>{error}</div>}
          {message && <div style={{ background: 'var(--halal-bg)', color: '#059669', padding: '12px', borderRadius: '8px', fontSize: '0.79rem', border: '1px solid #6ee7b7' }}>{message}</div>}

          <button onClick={handleSubmit} disabled={loading || !password} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '4px', fontSize: '0.88rem', opacity: (loading || !password) ? 0.7 : 1 }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Verify Email Page ────────────────────────────────────── */
export const VerifyEmailPage = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const verifyUrl = queryParams.get('url');

    if (verifyUrl) {
      const verifyEmail = async () => {
        setVerifying(true);
        try {
          // Handle absolute URLs from the backend if APP_URL doesn't match VITE_API_URL locally
          let finalUrl = verifyUrl;
          if (verifyUrl.startsWith('http')) {
            try {
              const urlObj = new URL(verifyUrl);
              const path = urlObj.pathname.replace('/api/v1', '');
              finalUrl = `${path}${urlObj.search}`;
            } catch (e) {
              console.error("Failed to parse verification URL", e);
            }
          }

          // Send request to the exact path using our configured Axios instance
          const res = await api.get(finalUrl);
          setMessage(res.data?.message || 'Email successfully verified!');
          
          // Refresh user profile so the app knows we are verified without a hard reload
          try {
            const profile = await api.get('/profile');
            if (profile.data) {
              setUser(profile.data);
            }
          } catch (e) {
            console.error("Failed to refresh profile after verification", e);
          }

          setTimeout(() => navigate('/portfolio'), 2000);
        } catch (err) {
          setError(err.response?.data?.message || 'Invalid or expired verification link.');
        }
        setVerifying(false);
      };
      verifyEmail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/email/resend');
      setMessage(res.data?.message || 'Verification link sent! Check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in" style={{ textAlign: 'center' }}>
        <img
          src="/logo.svg"
          alt="Irshad"
          style={{
            height: '72px', width: 'auto', objectFit: 'contain', margin: '0 auto 24px', display: 'block',
            filter: 'drop-shadow(0 4px 20px rgba(201,168,76,0.14))',
          }}
        />
        <h1 style={{ fontSize: '1.67rem', fontWeight: '800', marginBottom: '12px', color: 'var(--text-dark)' }}>
          {verifying ? 'Verifying email...' : (user?.email_verified_at || message) ? 'Email Verified' : 'Verify your email'}
        </h1>
        
        {!verifying && !message && !error && !user?.email_verified_at && (
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6' }}>
            Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you? 
            <br /><br />
            If you didn't receive the email, we will gladly send you another.
          </p>
        )}

        {error && <div style={{ background: 'var(--non-halal-bg)', color: 'var(--non-halal)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontWeight: 600 }}>{error}</div>}
        
        {(user?.email_verified_at || message) && (
          <div style={{ background: 'var(--halal-bg)', color: 'var(--halal)', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontWeight: 700, fontSize: '0.95rem', border: '1px solid var(--halal-border)' }}>
            ✓ {message || 'Your email address is verified! You now have full access to Irshad.'}
          </div>
        )}

        {!verifying && !message && !user?.email_verified_at && (
          <button 
            onClick={handleResend} 
            disabled={loading} 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.88rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        )}

        {(user?.email_verified_at || message) && (
          <button 
            onClick={() => navigate('/portfolio')} 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.88rem' }}
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

