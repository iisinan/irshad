import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, FileText, Download, BookOpen, Search, X, Plus, Edit2, Trash2 } from 'lucide-react';
import api, { createResource, updateResource, deleteResource } from '../services/api';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

export default function ResourcesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const firstRender = useRef(true);
  const { user } = useAuth();
  
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageData, setManageData] = useState({ id: null, title: '', type: 'video', url: '', thumbnail: '', duration: '', category: '', scholar: '' });
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState('');

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const response = await api.get('/resources', {
          params: { search, type: filter }
        });
        setResources(response.data.data);
      } catch (err) {
        console.error('Failed to fetch resources:', err);
      } finally {
        setLoading(false);
      }
    };

    if (firstRender.current) {
      firstRender.current = false;
      fetchResources();
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchResources();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, filter]);

  const handleOpenManageModal = (item = null) => {
    if (item) {
      setManageData(item);
    } else {
      setManageData({ id: null, title: '', type: 'video', url: '', thumbnail: '', duration: '', category: '', scholar: '' });
    }
    setShowManageModal(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    setManageLoading(true);
    setManageError('');
    try {
      if (manageData.id) {
        await updateResource(manageData.id, manageData);
      } else {
        await createResource(manageData);
      }
      setShowManageModal(false);
      window.location.reload();
    } catch (err) {
      setManageError(err.response?.data?.message || 'Failed to save resource');
    } finally {
      setManageLoading(false);
    }
  };

  const handleDeleteResource = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await deleteResource(id);
        setResources(resources.filter(r => r.id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete resource');
      }
    }
  };

  return (
    <>
      <div className="animate-fade-in page-wrapper" style={{ paddingBottom: '0px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', marginBottom: '80px' }}>
          
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-label" style={{ marginBottom: '16px' }}>Education</div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-1px', marginBottom: '16px' }}>
              Learn Halal Investing
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.97rem', maxWidth: '600px', margin: '0 auto' }}>
              Master the principles of Islamic finance with our curated library of videos, tutorials, and AAOIFI standards.
            </p>
          </div>

          <div className="animate-fade-in stagger-1" style={{ background: 'var(--bg)', borderRadius: '24px', padding: '0', boxShadow: '0 24px 64px rgba(0,0,0,0.06)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            
            {/* Header Banner */}
            <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', padding: '32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-60px', left: '30%', width: '150px', height: '150px', background: 'rgba(201,168,76,0.04)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <BookOpen size={26} fill="currentColor" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.41rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>Resource Library</h2>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.84rem', marginTop: '2px' }}>Verified scholars · AAOIFI-aligned content</p>
                  </div>
                </div>

                {/* Filters & Search */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                    <input 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search resources..." 
                      style={{
                        padding: '10px 14px 10px 34px', borderRadius: '12px',
                        border: '1.5px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.12)',
                        color: 'white', fontSize: '0.79rem', outline: 'none', 
                        width: '100%', minWidth: '210px',
                        backdropFilter: 'blur(4px)',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '3px', gap: '2px', border: '1px solid rgba(255,255,255,0.15)', flexWrap: 'wrap' }}>
                    {[['all','All'],['video','Videos'],['document','Docs']].map(([val, lbl]) => (
                      <button
                        key={val}
                        onClick={() => setFilter(val)}
                        style={{
                          padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                          fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.2s',
                          background: filter === val ? 'var(--bg)' : 'transparent',
                          color: filter === val ? 'var(--primary)' : 'rgba(255,255,255,0.8)',
                          boxShadow: filter === val ? 'var(--shadow-sm)' : 'none',
                        }}
                      >{lbl}</button>
                    ))}
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => handleOpenManageModal()}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', 
                      background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', 
                      borderRadius: '12px', cursor: 'pointer', fontWeight: 700, color: 'white', 
                      transition: 'all 0.2s', marginTop: '10px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                  >
                    <Plus size={16} /> Add Resource
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '32px' }}>

            {/* Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Fetching resources...</p>
              </div>
            ) : resources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <Search size={40} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p>No resources found matching your search.</p>
              </div>
            ) : (
              (() => {
                const uniqueCategories = ['All', ...new Set(resources.map(r => r.category).filter(Boolean))];
                const filteredResources = resources.filter(item => {
                  if (categoryFilter === 'All') return true;
                  return item.category === categoryFilter;
                });
                
                const groupedResources = filteredResources.reduce((acc, item) => {
                  const cat = item.category || 'General';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                }, {});

                const renderCard = (item, i) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className="roll-in-anim"
                    style={{ 
                      animationDelay: `${i * 0.05}s`,
                      display: 'flex', flexDirection: 'column',
                      background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)',
                      overflow: 'hidden', color: 'inherit',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s', cursor: 'pointer'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    {item.type === 'video' ? (
                      <div style={{ width: '100%', height: '180px', position: 'relative', background: '#000' }}>
                        <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)' }}>
                            <Play size={20} fill="currentColor" style={{ marginLeft: '4px' }} />
                          </div>
                        </div>
                        <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'var(--bg)', fontSize: '0.62rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px' }}>
                          {item.duration}
                        </div>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '180px', background: 'linear-gradient(145deg, var(--primary-50) 0%, var(--bg-section) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: '60px', height: '60px', background: 'var(--primary-50)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid var(--primary-100)', boxShadow: '0 8px 20px rgba(15,82,87,0.12)' }}>
                          <FileText size={28} strokeWidth={1.5} color="var(--primary)" />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>PDF Document</span>
                      </div>
                    )}
                    
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase', background: 'var(--primary-50)', padding: '4px 8px', borderRadius: '4px' }}>
                          {item.category}
                        </span>
                        {item.type === 'document' ? <Download size={14} color="var(--text-light)" /> : <Play size={14} color="var(--text-light)" />}
                      </div>
                      <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.4, marginBottom: '8px' }}>
                        {item.title}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.53rem', color: 'var(--text-dark)' }}>
                          {item.scholar?.charAt(0) || 'I'}
                        </div>
                        {item.scholar}
                      </div>
                      
                      {user?.role === 'admin' && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleOpenManageModal(item)} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--bg-section)', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                            <Edit2 size={14} /> Edit
                          </button>
                          <button onClick={(e) => handleDeleteResource(item.id, e)} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--non-halal-bg)', border: '1px solid var(--non-halal)', color: 'var(--non-halal)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div>
                    {/* Category Tabs */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                      {uniqueCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          style={{
                            padding: '8px 18px', borderRadius: '100px', border: '1.5px solid',
                            borderColor: categoryFilter === cat ? 'var(--primary)' : 'var(--border)',
                            background: categoryFilter === cat ? 'var(--primary)' : 'var(--bg-section)',
                            color: categoryFilter === cat ? 'white' : 'var(--text-dark)',
                            fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: categoryFilter === cat ? '0 4px 12px rgba(15,82,87,0.2)' : 'none'
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Grouped Layout */}
                    {Object.entries(groupedResources).map(([cat, items]) => (
                      <div key={cat} style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '2px solid var(--primary-50)', paddingBottom: '10px' }}>
                          <div style={{ width: '6px', height: '22px', background: 'var(--primary)', borderRadius: '4px' }} />
                          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>{cat}</h2>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-section)', padding: '2px 10px', borderRadius: '12px', border: '1px solid var(--border)' }}>{items.length} {items.length === 1 ? 'Resource' : 'Resources'}</span>
                        </div>
                        <div className="lectures-grid">
                          {items.map((item, i) => renderCard(item, i))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />

      {/* Resource Modal */}
      {selectedItem && createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setSelectedItem(null)}>
          <div style={{ background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '1.06rem', fontWeight: 800, color: 'var(--text-dark)' }}>{selectedItem.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.79rem', marginTop: '4px', fontWeight: 600 }}>By {selectedItem.scholar}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'var(--bg-section)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-section)', display: 'flex', flexDirection: 'column' }}>
              {selectedItem.type === 'video' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '100%', flex: 1, background: 'black', position: 'relative' }}>
                    <iframe 
                      src={selectedItem.url} 
                      title={selectedItem.title}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div style={{ padding: '24px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '0.97rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Description</h4>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      This is an educational video provided by our Islamic Finance partners. Please note that the content is for educational purposes and should not be taken as direct financial advice.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 24px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)' }}>Document Viewer</h4>
                    <a href={selectedItem.url} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.75rem' }}>
                      <Download size={16} /> Download PDF
                    </a>
                  </div>
                  <div style={{ flex: 1, width: '100%' }}>
                    <iframe 
                      src={selectedItem.url} 
                      title={selectedItem.title}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    ></iframe>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      {/* Admin Manage Resource Modal */}
      {showManageModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '24px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '600px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.25)', border: '1px solid var(--border)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Resource Library</div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>{manageData.id ? 'Edit Resource' : 'Add New Resource'}</h3>
              </div>
              <button onClick={() => setShowManageModal(false)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveResource} style={{ padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {manageError && (
                <div style={{ background: 'var(--non-halal-bg)', color: 'var(--non-halal)', padding: '12px 16px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 600, border: '1px solid var(--non-halal-border)' }}>{manageError}</div>
              )}

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Title</label>
                <input required type="text" value={manageData.title} onChange={e => setManageData({...manageData, title: e.target.value})} placeholder="e.g. Introduction to Islamic Finance" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              {/* Type + Category row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Type</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['video', 'document'].map(t => (
                      <button
                        key={t} type="button"
                        onClick={() => setManageData({...manageData, type: t})}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid',
                          borderColor: manageData.type === t ? 'var(--primary)' : 'var(--border)',
                          background: manageData.type === t ? 'var(--primary-50)' : 'var(--bg-section)',
                          color: manageData.type === t ? 'var(--primary)' : 'var(--text-muted)',
                          fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                          textTransform: 'capitalize',
                        }}
                      >{t === 'video' ? '▶ Video' : '📄 Document'}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Category</label>
                  <input required type="text" value={manageData.category} onChange={e => setManageData({...manageData, category: e.target.value})} placeholder="e.g. Fiqh, Zakat" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>

              {/* URL */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Resource URL</label>
                <input required type="url" value={manageData.url} onChange={e => setManageData({...manageData, url: e.target.value})} placeholder="https://youtube.com/... or /storage/file.pdf" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              {/* Video fields */}
              {manageData.type === 'video' && (
                <div style={{ padding: '20px', background: 'var(--primary-50)', borderRadius: '14px', border: '1px solid var(--primary-100)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>Video Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>Thumbnail URL</label>
                      <input type="url" value={manageData.thumbnail || ''} onChange={e => setManageData({...manageData, thumbnail: e.target.value})} placeholder="https://img.youtube.com/..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--primary-100)', background: 'var(--bg)', color: 'var(--text-dark)', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>Duration</label>
                      <input type="text" value={manageData.duration || ''} onChange={e => setManageData({...manageData, duration: e.target.value})} placeholder="e.g. 10:45" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--primary-100)', background: 'var(--bg)', color: 'var(--text-dark)', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Scholar */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Scholar / Author</label>
                <input required type="text" value={manageData.scholar} onChange={e => setManageData({...manageData, scholar: e.target.value})} placeholder="e.g. Sheikh Musa Furber" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowManageModal(false)} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'var(--bg-section)', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>Cancel</button>
                <button type="submit" disabled={manageLoading} style={{ flex: 2, padding: '13px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 700, cursor: manageLoading ? 'not-allowed' : 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(15,82,87,0.2)' }}>
                  {manageLoading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : (manageData.id ? 'Save Changes' : 'Add Resource')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
