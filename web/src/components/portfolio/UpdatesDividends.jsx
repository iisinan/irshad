import React, { useState, useEffect } from 'react';
import { Star, AlertTriangle } from 'lucide-react';
import { fetchUpdatesNews } from '../../services/api';
import localforage from 'localforage';
import { MarketCard, EmptyState, CardSkeleton } from './UpdatesNews'; // I will need to export these from UpdatesNews.jsx

export default function UpdatesDividends() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await fetchUpdatesNews();
      setData(res.data);
      localforage.setItem('irshad_updates_news_cache', res.data);
    } catch (err) {
      if (!data && !silent) setError(err?.response?.data?.message || 'Failed to load dividends.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    localforage.getItem('irshad_updates_news_cache').then(cached => {
      if (cached && !data) {
        setData(cached);
        setLoading(false);
      }
    }).catch(() => {});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dividendsData = data?.dividends || [];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title="Failed to Load" subtitle={error} color="var(--non-compliant)" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(209,165,98,0.1)', padding: '8px', borderRadius: '10px' }}>
              <Star size={18} color="var(--gold)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>Dividends & Payouts</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{dividendsData.length} recent announcements</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dividendsData.length === 0
              ? <EmptyState icon={Star} title="No Dividend News" subtitle="No recent dividend announcements detected." color="var(--gold)" />
              : dividendsData.map(item => <MarketCard key={item.id} item={item} />)
            }
          </div>
        </div>
      )}
    </div>
  );
}
