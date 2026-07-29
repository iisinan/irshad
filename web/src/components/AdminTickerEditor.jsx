import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Save, Plus, Trash2, Activity, Info, FileText, Newspaper, X, ChevronRight } from 'lucide-react';
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
  const [financialsForm, setFinancialsForm] = useState({ total_assets: 0, total_debt: 0, cash: 0, interest_income: 0, total_revenue: 0, evidence_links: [''] });
  
  // News state
  const [newsForm, setNewsForm] = useState({ title: '', url: '', source: '', thumbnail_url: '', excerpt: '' });
  const [showNewsModal, setShowNewsModal] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'scholar') {
      navigate('/portfolio');
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
      let evLinks = fin?.evidence_link ? fin.evidence_link : [];
      if (typeof evLinks === 'string') {
        try {
          const parsed = JSON.parse(evLinks);
          evLinks = Array.isArray(parsed) ? parsed : [evLinks];
        } catch(e) {
          evLinks = [evLinks];
        }
      }
      if (!Array.isArray(evLinks) || evLinks.length === 0) {
        evLinks = [''];
      }
      setFinancialsForm({
        market_cap: data.market_cap || 0,
        total_assets: fin?.total_assets || 0,
        total_debt: fin?.total_debt || 0,
        cash: fin?.cash_and_equivalents || 0,
        interest_income: fin?.interest_income || 0,
        total_revenue: fin?.total_revenue || 0,
        evidence_links: evLinks
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
      setNewsForm({ title: '', url: '', source: '', thumbnail_url: '', excerpt: '' });
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
    return (
      <div className="admin-page-padding" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Breadcrumb skeleton */}
        <div style={{ height: '14px', borderRadius: '6px', background: 'var(--bg-section)', width: '200px', marginBottom: '20px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        {/* Header skeleton */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-section)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div>
            <div style={{ height: '22px', borderRadius: '6px', background: 'var(--bg-section)', width: '280px', marginBottom: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: '13px', borderRadius: '6px', background: 'var(--bg-section)', width: '200px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
        {/* Tabs skeleton */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: '42px', borderRadius: '12px', background: 'var(--bg-section)', width: '150px', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
        <div style={{ background: 'var(--bg)', borderRadius: '20px', border: '1px solid var(--border)', padding: '40px' }}>
          {[1,2,3].map(i => <div key={i} style={{ height: '14px', borderRadius: '6px', background: 'var(--bg-section)', marginBottom: '16px', width: i === 3 ? '50%' : '100%', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      </div>
    );
  }

  if (!stock) return null;

  const currentStatus = stock.status?.status || 'review';
  const statusColors = {
    halal: { color: 'var(--halal)', bg: 'var(--halal-bg)' },
    'non-halal': { color: 'var(--non-halal)', bg: 'var(--non-halal-bg)' },
    doubtful: { color: 'var(--doubtful)', bg: 'var(--doubtful-bg)' },
    review: { color: 'var(--review)', bg: 'var(--review-bg)' },
  };
  const sc = statusColors[currentStatus] || statusColors.review;

  return (
    <div className="animate-fade-in admin-page-padding" style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── Breadcrumb ───────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin</span>
        <ChevronRight size={12} color="var(--text-light)" />
        <Link to="/admin" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none' }}>Dashboard</Link>
        <ChevronRight size={12} color="var(--text-light)" />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{symbol}</span>
      </div>

      {/* ── Page Header ───────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '14px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dark)', textDecoration: 'none', flexShrink: 0, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px' }}>
                {stock.symbol}
              </h1>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.1rem' }}>{stock.name}</span>
              <span style={{ padding: '3px 12px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, background: sc.bg, color: sc.color }}>
                {currentStatus.replace('-', ' ').toUpperCase()}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.83rem' }}>
              {stock.sector || 'No sector'} • Manage ticker data, financials, news, and compliance status.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', background: 'var(--bg-section)', padding: '5px', borderRadius: '16px', width: 'fit-content' }}>
          {[
            { id: 'verdict', label: 'Verdict', icon: Activity },
            { id: 'financials', label: 'Financials', icon: Calculator },
            { id: 'about', label: 'About', icon: Info },
            { id: 'news', label: 'News', icon: Newspaper }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '12px',
                background: activeTab === tab.id ? 'var(--bg)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-dark)' : 'var(--text-muted)',
                border: 'none', fontWeight: activeTab === tab.id ? 700 : 600,
                cursor: 'pointer', transition: 'all 0.2s',
                whiteSpace: 'nowrap', fontSize: '0.83rem',
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <tab.icon size={15} style={{ opacity: activeTab === tab.id ? 1 : 0.7 }} /> {tab.label}
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Tab Panel top label */}
          <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {activeTab === 'verdict' ? 'Compliance Verdict' : activeTab === 'financials' ? 'AAOIFI Financial Data' : activeTab === 'about' ? 'Company Profile' : 'News & Updates'}
            </span>
          </div>

          <div style={{ padding: '32px' }}>
          
          {/* VERDICT TAB */}
          {activeTab === 'verdict' && (
            <form onSubmit={handleSaveVerdict} className="animate-fade-in">
              {/* Status Pill Selector */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>New Compliance Status</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[
                    { val: 'halal', label: '✅ Halal', color: 'var(--halal)', bg: 'var(--halal-bg)', border: 'var(--halal-border)' },
                    { val: 'doubtful', label: '⚠️ Doubtful', color: 'var(--doubtful)', bg: 'var(--doubtful-bg)', border: 'rgba(245,158,11,0.25)' },
                    { val: 'non-halal', label: '❌ Non-Halal', color: 'var(--non-halal)', bg: 'var(--non-halal-bg)', border: 'var(--non-halal-border)' },
                  ].map(s => (
                    <button key={s.val} type="button"
                      onClick={() => setVerdictForm({...verdictForm, status: s.val})}
                      style={{
                        flex: 1, minWidth: '120px', padding: '16px', borderRadius: '14px',
                        border: `2px solid ${verdictForm.status === s.val ? s.color : 'var(--border)'}`,
                        background: verdictForm.status === s.val ? s.bg : 'var(--bg-section)',
                        color: verdictForm.status === s.val ? s.color : 'var(--text-muted)',
                        fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s',
                        transform: verdictForm.status === s.val ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >{s.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Scholar Reason / Justification</label>
                <textarea
                  rows={5}
                  value={verdictForm.reason}
                  onChange={e => setVerdictForm({...verdictForm, reason: e.target.value})}
                  placeholder="Explain why this compliance status is being manually set. Reference Quran, Hadith, or AAOIFI standards where applicable..."
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  This override will be logged with your name and timestamp.
                </span>
                <button type="submit" disabled={saving || !verdictForm.reason} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', opacity: (saving || !verdictForm.reason) ? 0.5 : 1 }}>
                  {saving ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: 'white' }} /> : <><Save size={15} /> Save Verdict</>}
                </button>
              </div>
            </form>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <form onSubmit={handleSaveAbout} className="animate-fade-in">
              
              {/* Basic identity */}
              <div style={{ background: 'var(--bg-section)', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Basic Identity</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {[
                    { label: 'Company Name', key: 'name', placeholder: 'e.g. Access Bank Plc' },
                    { label: 'Sector', key: 'sector', placeholder: 'e.g. Financial Services' },
                    { label: 'Industry', key: 'industry', placeholder: 'e.g. Commercial Banking' },
                  ].map(f => (
                    <div key={f.key} style={f.key === 'industry' ? { gridColumn: '1/-1' } : {}}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{f.label}</label>
                      <input type="text" value={aboutForm[f.key] || ''} onChange={e => setAboutForm({...aboutForm, [f.key]: e.target.value})} placeholder={f.placeholder}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', outline: 'none', fontSize: '0.88rem', fontFamily: 'inherit' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={{ background: 'var(--bg-section)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Description</div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Short Description</label>
                  <textarea rows={2} value={aboutForm.description || ''} onChange={e => setAboutForm({...aboutForm, description: e.target.value})} placeholder="One-liner displayed on ticker cards..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', outline: 'none', fontFamily: 'inherit', fontSize: '0.88rem', resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Detailed Overview</label>
                  <textarea rows={5} value={aboutForm.overview || ''} onChange={e => setAboutForm({...aboutForm, overview: e.target.value})} placeholder="Full company overview displayed on the stock detail page..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', outline: 'none', fontFamily: 'inherit', fontSize: '0.88rem', resize: 'vertical', lineHeight: 1.6 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px' }}>
                  {saving ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: 'white' }} /> : <><Save size={15} /> Save Company Info</>}
                </button>
              </div>
            </form>
          )}

          {/* FINANCIALS TAB */}
          {activeTab === 'financials' && (
            <form onSubmit={handleSaveFinancials} className="animate-fade-in">
              {/* Info callout */}
              <div style={{ padding: '14px 18px', background: 'var(--primary-50)', borderRadius: '12px', border: '1px solid var(--primary-100)', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>ℹ️</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, lineHeight: 1.5 }}>
                  Updating these values will automatically recalculate the AAOIFI screening ratios. The Debt/Market Cap, Cash/Market Cap (&lt; 30%), and Impure Income/Revenue (&lt; 5%) ratios must all pass for a Halal result.
                </p>
              </div>

              {/* AAOIFI Ratio Preview */}
              {(financialsForm.market_cap > 0 || financialsForm.total_assets > 0 || financialsForm.total_revenue > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  {[
                    {
                      label: 'Debt / Market Cap',
                      value: financialsForm.market_cap > 0 ? ((financialsForm.total_debt / financialsForm.market_cap) * 100).toFixed(1) : 0,
                      threshold: 30,
                    },
                    {
                      label: 'Cash / Market Cap',
                      value: financialsForm.market_cap > 0 ? ((financialsForm.cash / financialsForm.market_cap) * 100).toFixed(1) : 0,
                      threshold: 30,
                    },
                    {
                      label: 'Impure Income / Revenue',
                      value: financialsForm.total_revenue > 0 ? ((financialsForm.interest_income / financialsForm.total_revenue) * 100).toFixed(1) : 0,
                      threshold: 5,
                    },
                  ].map(r => {
                    const pct = parseFloat(r.value);
                    const pass = pct <= r.threshold;
                    return (
                      <div key={r.label} style={{ padding: '16px 20px', borderRadius: '14px', border: `1px solid ${pass ? 'var(--halal-border)' : 'var(--non-halal-border)'}`, background: pass ? 'var(--halal-bg)' : 'var(--non-halal-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: pass ? 'var(--halal)' : 'var(--non-halal)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{r.label}</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: pass ? 'var(--halal)' : 'var(--non-halal)', lineHeight: 1.1, marginTop: '4px' }}>{r.value}%</div>
                        </div>
                        <div style={{ fontSize: '1.5rem' }}>{pass ? '✅' : '❌'}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Financial inputs */}
              <div style={{ background: 'var(--bg-section)', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Balance Sheet</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {[
                    { label: 'Market Cap', key: 'market_cap' },
                    { label: 'Total Assets', key: 'total_assets' },
                    { label: 'Total Debt (Interest Bearing)', key: 'total_debt' },
                    { label: 'Cash & Equivalents', key: 'cash' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{f.label}</label>
                      <input type="number" step="0.01" value={financialsForm[f.key] || 0}
                        onChange={e => setFinancialsForm({...financialsForm, [f.key]: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit' }} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--bg-section)', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Income Statement</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {[
                    { label: 'Total Revenue', key: 'total_revenue' },
                    { label: 'Interest / Non-Permissible Income', key: 'interest_income' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{f.label}</label>
                      <input type="number" step="0.01" value={financialsForm[f.key]}
                        onChange={e => setFinancialsForm({...financialsForm, [f.key]: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence links */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Evidence / Source Links</label>
                  <button type="button"
                    onClick={() => setFinancialsForm({...financialsForm, evidence_links: [...financialsForm.evidence_links, '']})}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--primary-50)', border: '1px solid var(--primary-100)', color: 'var(--primary)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  ><Plus size={13} /> Add Source</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {financialsForm.evidence_links.map((link, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>🔗</span>
                        <input type="url" value={link}
                          onChange={e => {
                            const newLinks = [...financialsForm.evidence_links];
                            newLinks[idx] = e.target.value;
                            setFinancialsForm({...financialsForm, evidence_links: newLinks});
                          }}
                          placeholder="https://..."
                          style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', outline: 'none', fontSize: '0.85rem', fontFamily: 'inherit' }} />
                      </div>
                      {financialsForm.evidence_links.length > 1 && (
                        <button type="button"
                          onClick={() => setFinancialsForm({...financialsForm, evidence_links: financialsForm.evidence_links.filter((_, i) => i !== idx)})}
                          style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--non-halal-bg)', color: 'var(--non-halal)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        ><Trash2 size={15} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px' }}>
                  {saving ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: 'white' }} /> : <><Save size={15} /> Save & Recalculate</>}
                </button>
              </div>
            </form>
          )}

          {/* NEWS TAB */}
          {activeTab === 'news' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>Company News</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{stock.news?.length || 0} article{(stock.news?.length || 0) !== 1 ? 's' : ''} attached</div>
                </div>
                <button onClick={() => setShowNewsModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.82rem' }}>
                  <Plus size={15} /> Add Article
                </button>
              </div>

              {stock.news && stock.news.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stock.news.map(n => (
                    <div key={n.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '16px 20px', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--bg-section)', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      {n.thumbnail_url && (
                        <img src={n.thumbnail_url} alt={n.title}
                          style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                          onError={e => e.target.style.display = 'none'}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.9rem', marginBottom: '4px', lineHeight: 1.4 }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600 }}>{n.source}</span> · {new Date(n.published_at || n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <a href={n.url} target="_blank" rel="noreferrer"
                          style={{ fontSize: '0.78rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >Read Article →</a>
                      </div>
                      <button onClick={() => handleDeleteNews(n.id)}
                        style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--non-halal-bg)'; e.currentTarget.style.color = 'var(--non-halal)'; e.currentTarget.style.borderColor = 'var(--non-halal)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '56px 40px', textAlign: 'center', border: '1.5px dashed var(--border)', borderRadius: '16px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📰</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>No news articles yet</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Add curated news to display on this ticker's detail page.</div>
                </div>
              )}
            </div>
          )}

          </div>
        </div>
      </div>

      {/* ADD NEWS MODAL */}
      {showNewsModal && createPortal(
        <div className="admin-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
          <div className="animate-fade-in admin-modal-body" style={{ background: 'var(--bg)', width: '100%', maxWidth: '480px', borderRadius: '24px', boxShadow: '0 32px 64px rgba(0,0,0,0.2)', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{stock.symbol} · News</div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>Add News Article</h3>
              </div>
              <button onClick={() => setShowNewsModal(false)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddNews} style={{ padding: '28px', overflowY: 'auto' }}>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Article Title</label>
                <input type="text" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Source (e.g., Bloomberg, Reuters)</label>
                <input type="text" value={newsForm.source} onChange={e => setNewsForm({...newsForm, source: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Thumbnail Image URL (Optional)</label>
                <input type="url" value={newsForm.thumbnail_url} onChange={e => setNewsForm({...newsForm, thumbnail_url: e.target.value})} placeholder="https://..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Excerpt / Summary (Optional)</label>
                <textarea rows={3} value={newsForm.excerpt} onChange={e => setNewsForm({...newsForm, excerpt: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Article URL</label>
                <input type="url" value={newsForm.url} onChange={e => setNewsForm({...newsForm, url: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', fontSize: '0.88rem', outline: 'none' }} />
              </div>

              <div className="admin-modal-actions" style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowNewsModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--bg-section)', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 1.5, padding: '14px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {saving ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Add Article'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
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
