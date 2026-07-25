import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Save, Plus, Trash2, Activity, Info, FileText, Newspaper, X } from 'lucide-react';
import api, { updateTickerAbout, addTickerNews, deleteTickerNews, overrideStockStatus } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminTickerEditor() {
  const { symbol } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('verdict'); // verdict, financials, about, news

  // Form states
  const [verdictForm, setVerdictForm] = useState({ status: 'halal', reason: '' });
  const [aboutForm, setAboutForm] = useState({ name: '', sector: '', industry: '', description: '', overview: '' });
  const [financialsForm, setFinancialsForm] = useState({ total_assets: 0, total_debt: 0, cash: 0, interest_income: 0, total_revenue: 0, evidence_link: '' });
  
  // News state
  const [newsForm, setNewsForm] = useState({ title: '', url: '', source: '' });
  const [showNewsModal, setShowNewsModal] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'scholar') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [symbol, user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/stocks/${symbol}`);
      const data = res.data?.data || res.data;
      setStock(data);

      // Populate forms
      setVerdictForm({ status: data.status?.status || 'halal', reason: data.status?.reason || '' });
      setAboutForm({ name: data.name || '', sector: data.sector || '', industry: data.industry || '', description: data.description || '', overview: data.overview || '' });
      
      const fin = data.financials?.[0];
      setFinancialsForm({
        total_assets: fin?.total_assets || 0,
        total_debt: fin?.total_debt || 0,
        cash: fin?.cash_and_equivalents || 0,
        interest_income: fin?.interest_income || 0,
        total_revenue: fin?.total_revenue || 0,
        evidence_link: fin?.evidence_link || ''
      });
      
    } catch (err) {
      toast.error('Failed to load ticker data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVerdict = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await overrideStockStatus(symbol, verdictForm);
      toast.success('Verdict updated successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update verdict');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAbout = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTickerAbout(symbol, aboutForm);
      toast.success('About information updated');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update info');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFinancials = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/stocks/${symbol}/aaoifi`, financialsForm);
      toast.success('Financials updated and screening recalculated');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update financials');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNews = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addTickerNews(symbol, newsForm);
      toast.success('News article added');
      setNewsForm({ title: '', url: '', source: '' });
      setShowNewsModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add news');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNews = async (newsId) => {
    if(!window.confirm('Delete this news article?')) return;
    try {
      await deleteTickerNews(symbol, newsId);
      toast.success('News deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete news');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>;
  }

  if (!stock) return null;

  return (
    <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <Link to="/admin?tab=stocks" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-section)', color: 'var(--text-dark)', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
            {stock.symbol} <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.25rem' }}>{stock.name}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage ticker data, financials, news, and compliance status.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}>
        
        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {[
            { id: 'verdict', label: 'Compliance Verdict', icon: Activity },
            { id: 'financials', label: 'Financial Data', icon: Calculator },
            { id: 'about', label: 'About Information', icon: Info },
            { id: 'news', label: 'News & Updates', icon: Newspaper }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px',
                background: activeTab === tab.id ? 'var(--primary)' : 'var(--bg-section)',
                color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: '24px', border: '1px solid var(--border)', padding: '32px' }}>
          
          {/* VERDICT TAB */}
          {activeTab === 'verdict' && (
            <form onSubmit={handleSaveVerdict} className="animate-fade-in">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', color: 'var(--text-dark)' }}>Override Compliance Verdict</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>New Status</label>
                <select 
                  value={verdictForm.status} 
                  onChange={e => setVerdictForm({...verdictForm, status: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '1rem', outline: 'none' }}
                >
                  <option value="halal">Halal</option>
                  <option value="doubtful">Doubtful</option>
                  <option value="non-halal">Non-Halal</option>
                </select>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Reason for Override (Required)</label>
                <textarea 
                  required
                  rows={4}
                  value={verdictForm.reason} 
                  onChange={e => setVerdictForm({...verdictForm, reason: e.target.value})}
                  placeholder="Explain why this status is being manually set..."
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving || !verdictForm.reason} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                  {saving ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: 'white' }} /> : <><Save size={16} /> Save Verdict</>}
                </button>
              </div>
            </form>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <form onSubmit={handleSaveAbout} className="animate-fade-in">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', color: 'var(--text-dark)' }}>Company Profile & Info</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Company Name</label>
                  <input type="text" value={aboutForm.name} onChange={e => setAboutForm({...aboutForm, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Sector</label>
                  <input type="text" value={aboutForm.sector} onChange={e => setAboutForm({...aboutForm, sector: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Industry</label>
                <input type="text" value={aboutForm.industry} onChange={e => setAboutForm({...aboutForm, industry: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Short Description</label>
                <textarea rows={2} value={aboutForm.description || ''} onChange={e => setAboutForm({...aboutForm, description: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Detailed Overview</label>
                <textarea rows={5} value={aboutForm.overview || ''} onChange={e => setAboutForm({...aboutForm, overview: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                  {saving ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: 'white' }} /> : <><Save size={16} /> Save Information</>}
                </button>
              </div>
            </form>
          )}

          {/* FINANCIALS TAB */}
          {activeTab === 'financials' && (
            <form onSubmit={handleSaveFinancials} className="animate-fade-in">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'var(--text-dark)' }}>Financial Data Overrides</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Updating these values will automatically trigger a recalculation of the AAOIFI compliance screening.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Total Assets</label>
                  <input type="number" step="0.01" value={financialsForm.total_assets} onChange={e => setFinancialsForm({...financialsForm, total_assets: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Total Debt (Interest Bearing)</label>
                  <input type="number" step="0.01" value={financialsForm.total_debt} onChange={e => setFinancialsForm({...financialsForm, total_debt: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Cash & Equivalents</label>
                  <input type="number" step="0.01" value={financialsForm.cash} onChange={e => setFinancialsForm({...financialsForm, cash: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Interest / Non-permissible Income</label>
                  <input type="number" step="0.01" value={financialsForm.interest_income} onChange={e => setFinancialsForm({...financialsForm, interest_income: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Total Revenue</label>
                  <input type="number" step="0.01" value={financialsForm.total_revenue} onChange={e => setFinancialsForm({...financialsForm, total_revenue: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Evidence Link / Source (URL)</label>
                <input type="url" value={financialsForm.evidence_link} onChange={e => setFinancialsForm({...financialsForm, evidence_link: e.target.value})} placeholder="https://..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                  {saving ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: 'white' }} /> : <><Save size={16} /> Save & Recalculate</>}
                </button>
              </div>
            </form>
          )}

          {/* NEWS TAB */}
          {activeTab === 'news' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-dark)' }}>Company News</h2>
                <button onClick={() => setShowNewsModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.88rem' }}>
                  <Plus size={16} /> Add Article
                </button>
              </div>

              {stock.news && stock.news.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {stock.news.map(n => (
                    <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-section)' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>{n.title}</div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{n.source} • {new Date(n.published_at).toLocaleDateString()}</div>
                        <a href={n.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.88rem', color: 'var(--primary)', textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>Read Article</a>
                      </div>
                      <button onClick={() => handleDeleteNews(n.id)} style={{ background: 'var(--non-halal-bg)', color: 'var(--non-halal)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                  No news articles found for this ticker.
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ADD NEWS MODAL */}
      {showNewsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg)', width: '100%', maxWidth: '420px', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>Add News Article</h3>
              <button onClick={() => setShowNewsModal(false)} style={{ background: 'var(--bg-section)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddNews} style={{ padding: '24px' }}>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Article Title</label>
                <input required type="text" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Source (e.g., Bloomberg, Reuters)</label>
                <input required type="text" value={newsForm.source} onChange={e => setNewsForm({...newsForm, source: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>URL</label>
                <input required type="url" value={newsForm.url} onChange={e => setNewsForm({...newsForm, url: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowNewsModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--bg-section)', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 1.5, padding: '14px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {saving ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Add Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Add a calculator icon since it wasn't imported at top
const Calculator = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <line x1="8" x2="16" y1="6" y2="6" />
    <line x1="16" x2="16" y1="14" y2="18" />
    <path d="M16 10h.01" />
    <path d="M12 10h.01" />
    <path d="M8 10h.01" />
    <path d="M12 14h.01" />
    <path d="M8 14h.01" />
    <path d="M12 18h.01" />
    <path d="M8 18h.01" />
  </svg>
)
