import re

with open('web/src/components/portfolio/UpdatesCompliance.jsx', 'r') as f:
    content = f.read()

# Rename component
content = content.replace('export default function UpdatesNews() {', 'export default function UpdatesCompliance() {')

# Remove BusinessCard and MarketCard
content = re.sub(r'/\* ── Business Update Card ── \*/.*?/\* ── Market Intelligence Card ── \*/', '/* ── Market Intelligence Card ── */', content, flags=re.DOTALL)
content = re.sub(r'/\* ── Market Intelligence Card ── \*/.*?export default function UpdatesCompliance', 'export default function UpdatesCompliance', content, flags=re.DOTALL)

# Simplify UpdatesCompliance component
component_code = """export default function UpdatesCompliance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await fetchUpdatesNews();
      setData(res.data);
      localforage.setItem('irshad_updates_compliance_cache', res.data);
    } catch (err) {
      if (!data && !silent) setError(err?.response?.data?.message || 'Failed to load compliance changes.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    localforage.getItem('irshad_updates_compliance_cache').then(cached => {
      if (cached) {
        setData(cached);
        setLoading(false);
      }
    }).catch(() => {});
    load(true);
  }, []);

  const complianceChanges = data?.compliance_changes || [];

  if (loading && !data) return <SkeletonLoader />;
  if (error) return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--non-compliant)', fontWeight: 800, marginBottom: '16px' }}>{error}</div>
      <button onClick={() => load(false)} style={{ padding: '10px 24px', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>Try Again</button>
    </div>
  );

  return (
    <div style={{ paddingBottom: '60px' }}>
      <SectionHeader icon={Shield} title="Compliance Status Changes" count={complianceChanges.length} color="var(--non-compliant)" />
      
      {complianceChanges.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No Recent Changes" subtitle="No companies have changed compliance status recently. You're all clear!" color="var(--halal)" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {complianceChanges.map(item => <ComplianceCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
"""

content = re.sub(r'export default function UpdatesCompliance\(\) \{.*$', component_code, content, flags=re.DOTALL)

with open('web/src/components/portfolio/UpdatesCompliance.jsx', 'w') as f:
    f.write(content)

