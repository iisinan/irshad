import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Shield, BookOpen, Bell, Trash2, LogOut, CheckCircle, AlertCircle, Save, Monitor } from 'lucide-react';
import { fetchProfile, updateProfile, deleteAccount } from '../services/api';

export default function Settings() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('irshad_theme') || 'light');

  // Form States
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone_number: '', 
    password: '', password_confirmation: '', 
    strictness: 'moderate' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const profileData = await fetchProfile();
        setProfileUser(profileData.data);
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (!authLoading && user) loadData();
  }, [user, authLoading]);

  useEffect(() => {
    if (profileUser || user) {
      const u = profileUser || user || {};
      setFormData(prev => ({
        ...prev,
        name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        email: u.email || '',
        phone_number: u.phone_number || '',
        strictness: u.preferences?.strictness || 'moderate'
      }));
    }
  }, [profileUser, user]);

  const handleUpdate = async (e, section) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    
    try {
      const payload = {};
      
      if (section === 'profile') {
        payload.name = formData.name;
        payload.email = formData.email;
        payload.phone_number = formData.phone_number;
      } else if (section === 'security') {
        if (formData.password !== formData.password_confirmation) {
          setMessage({ type: 'error', text: 'Passwords do not match' });
          setIsSubmitting(false);
          return;
        }
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      } else if (section === 'preferences') {
        payload.preferences = { ...((profileUser || user).preferences || {}), strictness: formData.strictness };
      }

      const res = await updateProfile(payload);
      setProfileUser(res.data);
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      
      if (section === 'security') {
        setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
      }
      
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    setIsSubmitting(true);
    try {
      await deleteAccount();
      logout();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete account. Please contact support.' });
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="loading-spinner" />
    </div>
  );

  const u = profileUser || user || {};
  const initials = (u.name || u.first_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const sections = [
    { id: 'profile', icon: User, label: 'Personal Info' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'preferences', icon: BookOpen, label: 'Shariah Preferences' },
    { id: 'appearance', icon: Monitor, label: 'Appearance' },
    { id: 'danger', icon: Trash2, label: 'Danger Zone', danger: true },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px 80px' }} className="animate-fade-in">
      
      <div className="animate-slide-up stagger-1" style={{ 
        background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 100%)', 
        borderRadius: '24px', padding: '32px 40px', marginBottom: '32px',
        color: 'white', display: 'flex', alignItems: 'center', gap: '20px',
        boxShadow: '0 12px 32px rgba(13,27,42,0.15)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-20px', right: '80px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        
        <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.8rem', fontWeight: 800, border: '2px solid rgba(255,255,255,0.4)' }}>
          {initials}
        </div>
        <div style={{ zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>Account Settings</h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>Manage your profile, security, and preferences.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Left Sidebar Menu */}
        <div className="animate-slide-up stagger-2" style={{ width: '240px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'sticky', top: '100px' }}>
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => { setActiveSection(sec.id); setMessage({ type: '', text: '' }); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px',
                border: 'none', background: activeSection === sec.id ? (sec.danger ? 'var(--non-halal-bg)' : 'white') : 'transparent',
                color: activeSection === sec.id ? (sec.danger ? 'var(--non-halal)' : 'var(--primary)') : 'var(--text-muted)',
                fontWeight: activeSection === sec.id ? 800 : 600,
                fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
                boxShadow: activeSection === sec.id && !sec.danger ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              <sec.icon size={18} />
              {sec.label}
            </button>
          ))}
          
          <div style={{ margin: '16px 0', height: '1px', background: 'var(--border)' }} />
          
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px',
              border: 'none', background: 'transparent', color: 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="animate-slide-up stagger-3" style={{ flex: 1, minWidth: '300px', background: 'white', borderRadius: '24px', border: '1px solid var(--border)', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
          
          {message.text && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '12px', marginBottom: '24px', background: message.type === 'success' ? 'var(--halal-bg)' : 'var(--non-halal-bg)', color: message.type === 'success' ? 'var(--halal)' : 'var(--non-halal)', fontSize: '0.9rem', fontWeight: 600 }}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          {activeSection === 'profile' && (
            <form onSubmit={e => handleUpdate(e, 'profile')} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 4px' }}>Personal Information</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Update your basic profile details.</p>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Full Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.95rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Phone Number</label>
                  <input type="tel" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.95rem', outline: 'none' }} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Email Address</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s', background: 'var(--bg)' }} readOnly />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Email cannot be changed.</p>
              </div>
              
              <div style={{ marginTop: '12px' }}>
                <button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeSection === 'security' && (
            <form onSubmit={e => handleUpdate(e, 'security')} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 4px' }}>Security</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Update your password to keep your account secure.</p>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>New Password</label>
                <input type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.95rem', outline: 'none' }} minLength={8} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Confirm Password</label>
                <input type="password" placeholder="••••••••" value={formData.password_confirmation} onChange={e => setFormData({...formData, password_confirmation: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.95rem', outline: 'none' }} minLength={8} required />
              </div>
              
              <div style={{ marginTop: '12px' }}>
                <button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  <Save size={18} /> {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {activeSection === 'preferences' && (
            <form onSubmit={e => handleUpdate(e, 'preferences')} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 4px' }}>Shariah Screening Strictness</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Choose how strictly you want the AI to evaluate companies based on the AAOIFI standard.</p>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['relaxed', 'moderate', 'strict'].map(level => (
                  <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', border: `2px solid ${formData.strictness === level ? 'var(--primary)' : 'var(--border)'}`, background: formData.strictness === level ? 'var(--primary-50)' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input type="radio" name="strictness" value={level} checked={formData.strictness === level} onChange={e => setFormData({...formData, strictness: e.target.value})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                    <div>
                      <div style={{ fontWeight: 800, color: formData.strictness === level ? 'var(--primary)' : 'var(--text-dark)', fontSize: '1rem', textTransform: 'capitalize', marginBottom: '4px' }}>{level} Screening</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {level === 'relaxed' && "Focuses only on core business activities. Ignores minor financial ratios."}
                        {level === 'moderate' && "Standard AAOIFI compliance. Checks 30% debt limits and 5% impure income."}
                        {level === 'strict' && "Zero-tolerance policy. Any non-compliant debt or income flags the stock as non-halal."}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              <div style={{ marginTop: '12px' }}>
                <button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}

          {activeSection === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 4px' }}>Appearance Settings</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Customize the look and feel of Irshad.</p>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-section)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)' }}>Theme</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Choose between Light and Dark mode.</p>
                </div>
                <select 
                  value={theme}
                  onChange={(e) => {
                    const newTheme = e.target.value;
                    setTheme(newTheme);
                    localStorage.setItem('irshad_theme', newTheme);
                    if (newTheme === 'dark') {
                      document.documentElement.setAttribute('data-theme', 'dark');
                    } else {
                      document.documentElement.removeAttribute('data-theme');
                    }
                    setMessage({ type: 'success', text: 'Theme updated successfully!' });
                    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                  }}
                  className="settings-input"
                  style={{ width: '150px' }}
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
            </div>
          )}

          {activeSection === 'danger' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--non-halal)', margin: '0 0 4px' }}>Danger Zone</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Irreversible and destructive actions.</p>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              
              <div style={{ background: 'var(--non-halal-bg)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: 'var(--non-halal)' }}>Delete Account</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dark)' }}>Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <button onClick={handleDeleteAccount} disabled={isSubmitting} style={{ padding: '12px 24px', background: 'var(--non-halal)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                  {isSubmitting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
