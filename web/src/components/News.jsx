import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const NewsPage = () => (
  <div className="animate-fade-in page-wrapper">
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <div className="section-label">News & Insights</div>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-1px', margin: '16px 0 16px', color: 'var(--text-dark)' }}>
          Latest Articles
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Market updates, Islamic finance analysis, and platform announcements to help you stay informed.
        </p>
      </div>
      
      <div className="news-grid">
        {[
          { 
            tag: 'Market Update', 
            date: 'Jul 9, 2026', 
            gradient: 'linear-gradient(135deg, #1A1208, #2a1f11)', 
            title: 'Market records positive trading week amidst new regulations', 
            excerpt: 'The Nigerian equities market closed on a positive note this week as investors reacted favorably to the CBN revised directives on foreign exchange.' 
          },
          { 
            tag: 'Islamic Finance', 
            date: 'Jul 2, 2026', 
            gradient: 'linear-gradient(135deg, #C9A84C, #e0bc59)', 
            title: 'Understanding AAOIFI Standards for Retail Investors in 2026', 
            excerpt: 'A deep dive into how the new AAOIFI standards affect methodology and what it means for everyday Nigerian investors building halal portfolios.' 
          },
          { 
            tag: 'Company News', 
            date: 'Jun 25, 2026', 
            gradient: 'radial-gradient(circle at top right, #F5F0E8, #e5dfd4)', 
            title: 'MTN Nigeria announces green bond and sustainability initiative', 
            excerpt: 'Following their Q2 earnings, MTN Nigeria unveiled a sweeping new environmental initiative aimed at reducing carbon emissions across cell sites.' 
          },
          { 
            tag: 'Platform', 
            date: 'Jun 18, 2026', 
            gradient: 'linear-gradient(135deg, #0d0a04, #1a1409)', 
            title: 'Irshad launches automated Purification Calculator for dividends', 
            excerpt: 'We are excited to announce the launch of our fully automated purification calculator, enabling users to calculate their exact obligation.' 
          },
          { 
            tag: 'Market Update', 
            date: 'Jun 10, 2026', 
            gradient: 'linear-gradient(135deg, #A48430, #C9A84C)', 
            title: 'Dangote Cement beats Q2 estimates; compliance status remains Halal', 
            excerpt: 'DANGCEM posted strong quarterly results driven by improved cement prices and operational efficiencies across the group.' 
          },
          { 
            tag: 'Islamic Finance', 
            date: 'Jun 2, 2026', 
            gradient: 'linear-gradient(135deg, #2a2012, #1A1208)', 
            title: 'Zakat on stocks: A comprehensive guide for investors', 
            excerpt: 'Calculating Zakat on listed equities can be complex. This guide breaks down the scholarly opinions and provides a practical framework.' 
          },
        ].map((a, i) => (
          <div className="news-card animate-fade-in" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="news-thumb-placeholder" style={{ background: a.gradient, height: '180px' }} />
            <div className="news-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="news-tag">{a.tag}</span>
                <span className="news-date">{a.date}</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', lineHeight: 1.4 }}>{a.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>{a.excerpt}</p>
              <Link to="#" className="btn-ghost" style={{ marginTop: '20px', fontSize: '0.9rem', padding: 0 }}>
                Read more <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default NewsPage;
