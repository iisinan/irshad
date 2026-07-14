import React, { useState } from 'react';
import { Play, FileText, Download, ExternalLink, BookOpen, Search } from 'lucide-react';

const LECTURES = [
  {
    id: 1,
    title: 'Principles of Halal Investing',
    scholar: 'Mufti Taqi Usmani',
    duration: '45 mins',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800',
    url: '#',
    category: 'Foundations'
  },
  {
    id: 2,
    title: 'Understanding Stock Purification',
    scholar: 'Sheikh Joe Bradford',
    duration: '32 mins',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800',
    url: '#',
    category: 'Purification'
  },
  {
    id: 3,
    title: 'AAOIFI Shariah Standard No. 21',
    scholar: 'AAOIFI Board',
    duration: 'PDF Document',
    type: 'document',
    thumbnail: null,
    url: '#',
    category: 'Standards'
  },
  {
    id: 4,
    title: 'The Fiqh of Modern Finance',
    scholar: 'Dr. Monzer Kahf',
    duration: '1 hr 15 mins',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800',
    url: '#',
    category: 'Advanced'
  },
  {
    id: 5,
    title: 'Zakat on Shares and Investments',
    scholar: 'Sheikh Yasir Qadhi',
    duration: '50 mins',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1583752028088-91e3e9880b46?auto=format&fit=crop&q=80&w=800',
    url: '#',
    category: 'Zakat'
  },
  {
    id: 6,
    title: 'Ruling on Tech Sector Investments',
    scholar: 'AMJA Fatwa Committee',
    duration: 'Fatwa Document',
    type: 'document',
    thumbnail: null,
    url: '#',
    category: 'Standards'
  }
];

export default function LecturesTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = LECTURES.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                        item.scholar.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || item.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="animate-fade-in stagger-1" style={{ background: 'white', borderRadius: '24px', padding: '40px 32px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--primary-50)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <BookOpen size={24} fill="currentColor" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>Resources</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Learn from verified Islamic scholars and institutions.</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search lectures..." 
              style={{
                padding: '8px 12px 8px 32px', borderRadius: '10px', border: '1.5px solid var(--border)',
                fontSize: '0.9rem', outline: 'none', width: '200px'
              }}
            />
          </div>
          <select 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ 
              padding: '8px 12px', borderRadius: '10px', border: '1.5px solid var(--border)',
              background: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', fontWeight: 600
            }}
          >
            <option value="all">All Types</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Search size={40} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
          <p>No resources found matching your search.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {filtered.map((item, i) => (
            <a 
              key={item.id} 
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="roll-in-anim"
              style={{ 
                animationDelay: `${i * 0.05}s`,
                display: 'flex', flexDirection: 'column',
                background: 'white', borderRadius: '16px', border: '1px solid var(--border)',
                overflow: 'hidden', textDecoration: 'none', color: 'inherit',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s', cursor: 'pointer'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {item.type === 'video' ? (
                <div style={{ width: '100%', height: '180px', position: 'relative', background: '#000' }}>
                  <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
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
                <div style={{ width: '100%', height: '180px', background: 'var(--bg-section)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <FileText size={48} strokeWidth={1} style={{ opacity: 0.5, marginBottom: '16px' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>PDF Document</span>
                </div>
              )}
              
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase', background: 'var(--primary-50)', padding: '4px 8px', borderRadius: '4px' }}>
                    {item.category}
                  </span>
                  {item.type === 'document' ? <Download size={14} color="var(--text-light)" /> : <ExternalLink size={14} color="var(--text-light)" />}
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
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
