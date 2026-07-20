import React, { useState, useEffect, useRef } from 'react';
import { Play, FileText, Download, ExternalLink, BookOpen, Search, X } from 'lucide-react';
import api from '../../services/api';

export default function LecturesTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const firstRender = useRef(true);

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

    // Debounce search slightly
    const timeoutId = setTimeout(() => {
      fetchResources();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, filter]);

  return (
    <>
      <div className="animate-fade-in stagger-1" style={{ background: 'white', borderRadius: '24px', padding: '0', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        
        {/* Header Banner */}
        <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(201,168,76,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '30%', width: '150px', height: '150px', background: 'rgba(201,168,76,0.04)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <BookOpen size={26} fill="currentColor" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>Islamic Finance Library</h2>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', marginTop: '2px' }}>Verified scholars · AAOIFI-aligned content</p>
              </div>
            </div>

            {/* Filters & Search */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                    color: 'white', fontSize: '0.9rem', outline: 'none', width: '210px',
                    backdropFilter: 'blur(4px)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '3px', gap: '2px', border: '1px solid rgba(255,255,255,0.15)' }}>
                {[['all','All'],['video','Videos'],['document','Docs']].map(([val, lbl]) => (
                  <button
                    key={val}
                    onClick={() => setFilter(val)}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.2s',
                      background: filter === val ? 'white' : 'transparent',
                      color: filter === val ? 'var(--primary)' : 'rgba(255,255,255,0.8)',
                      boxShadow: filter === val ? 'var(--shadow-sm)' : 'none',
                    }}
                  >{lbl}</button>
                ))}
              </div>
            </div>
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
          <div className="lectures-grid">
            {resources.map((item, i) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className="roll-in-anim"
                style={{ 
                  animationDelay: `${i * 0.05}s`,
                  display: 'flex', flexDirection: 'column',
                  background: 'white', borderRadius: '16px', border: '1px solid var(--border)',
                  overflow: 'hidden', color: 'inherit',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s', cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {item.type === 'video' ? (
                  <div style={{ width: '100%', height: '180px', position: 'relative', background: '#000' }}>
                    <img loading="lazy" src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Play size={20} fill="currentColor" style={{ marginLeft: '4px' }} />
                      </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px' }}>
                      {item.duration}
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '180px', background: 'linear-gradient(145deg, var(--primary-50) 0%, var(--bg-section) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '60px', height: '60px', background: 'var(--primary-50)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid var(--primary-100)', boxShadow: '0 8px 20px rgba(15,82,87,0.12)' }}>
                      <FileText size={28} strokeWidth={1.5} color="var(--primary)" />
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>PDF Document</span>
                  </div>
                )}
                
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase', background: 'var(--primary-50)', padding: '4px 8px', borderRadius: '4px' }}>
                      {item.category}
                    </span>
                    {item.type === 'document' ? <Download size={14} color="var(--text-light)" /> : <Play size={14} color="var(--text-light)" />}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.4, marginBottom: '8px' }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-dark)' }}>
                      {item.scholar.charAt(0)}
                    </div>
                    {item.scholar}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Resource Modal */}
      {selectedItem && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setSelectedItem(null)}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>{selectedItem.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px', fontWeight: 600 }}>By {selectedItem.scholar}</p>
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
                  <div style={{ padding: '24px', background: 'white', borderTop: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Description</h4>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      This is an educational video provided by our Islamic Finance partners. Please note that the content is for educational purposes and should not be taken as direct financial advice.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>Document Viewer</h4>
                    <a href={selectedItem.url} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}>
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
      )}
    </>
  );
}
