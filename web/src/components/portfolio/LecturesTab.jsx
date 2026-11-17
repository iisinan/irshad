import React, { useState, useEffect, useRef } from 'react';
import { Play, Download, BookOpen, Search } from 'lucide-react';
import api from '../../services/api';
import localforage from 'localforage';
import { ResourceCardMedia, ResourceViewerModal } from '../ResourceMedia';

export default function LecturesTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const firstRender = useRef(true);

  useEffect(() => {
    const fetchResources = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const response = await api.get('/resources', {
          params: { search, type: filter }
        });
        setResources(response.data.data);
        if (!search && filter === 'all') {
          localforage.setItem('irshad_resources_cache', response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch resources:', err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    if (firstRender.current) {
      firstRender.current = false;
      localforage.getItem('irshad_resources_cache').then(cached => {
        if (cached && Array.isArray(cached) && cached.length > 0) {
          setResources(cached);
          setLoading(false);
          fetchResources(true); // background refresh
        } else {
          fetchResources();
        }
      }).catch(() => {
        fetchResources();
      });
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
      <div className="animate-fade-in stagger-1" style={{ background: 'var(--bg)', borderRadius: '24px', padding: '0', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        
        {/* Header Banner */}
        <div className="alert-header" style={{ background: 'linear-gradient(to right, var(--bg) 40%, var(--primary-50) 100%)', padding: '28px 32px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
          {/* Decorative Right Edge Icon */}
          <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%) rotate(-5deg)', opacity: 0.08, pointerEvents: 'none', zIndex: 0 }}>
            <BookOpen size={180} color="var(--primary)" strokeWidth={1} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--bg)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(138, 76, 158, 0.12)' }}>
                <BookOpen size={26} strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.5px', margin: 0 }}>Islamic Finance Library</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', margin: 0, fontWeight: 500 }}>Verified scholars · AAOIFI-aligned content</p>
              </div>
            </div>

            {/* Filters & Search */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search resources..." 
                  style={{
                    padding: '10px 14px 10px 34px', borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--body-bg)',
                    color: 'var(--text-dark)', fontSize: '0.79rem', outline: 'none', width: '210px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', background: 'var(--body-bg)', borderRadius: '14px', padding: '4px', border: '1px solid var(--border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)' }}>
                {[['all','All'],['video','Videos'],['document','Docs']].map(([val, lbl]) => (
                  <button
                    key={val}
                    onClick={() => setFilter(val)}
                    style={{
                      padding: '8px 18px', borderRadius: '10px', border: filter === val ? '1px solid rgba(0,0,0,0.04)' : '1px solid transparent',
                      background: filter === val ? 'var(--bg)' : 'transparent',
                      color: filter === val ? 'var(--text-dark)' : 'var(--text-muted)',
                      fontWeight: filter === val ? 800 : 600, fontSize: '0.8rem', cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: filter === val ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="alert-body" style={{ padding: '32px' }}>

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
                  background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)',
                  overflow: 'hidden', color: 'inherit',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s', cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <ResourceCardMedia item={item} />
                
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
      <ResourceViewerModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}
