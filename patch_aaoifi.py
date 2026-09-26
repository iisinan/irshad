import re

content = open('web/src/components/AaoifiScreening.jsx').read()

# 1. Add Crown to lucide-react imports if not there
if 'Crown' not in content:
    content = content.replace('ArrowLeft, ArrowRight, CheckCircle', 'ArrowLeft, ArrowRight, CheckCircle, Crown')

# 2. Add PricingModal import
if 'PricingModal' not in content:
    content = content.replace("import AddHoldingModal from './portfolio/AddHoldingModal';", "import AddHoldingModal from './portfolio/AddHoldingModal';\nimport PricingModal from './PricingModal';")

# 3. Add state for showUpgradeModal
if 'const [showUpgradeModal, setShowUpgradeModal] = useState(false);' not in content:
    content = content.replace("const [verdictExpanded, setVerdictExpanded] = useState(false);", "const [verdictExpanded, setVerdictExpanded] = useState(false);\n  const [showUpgradeModal, setShowUpgradeModal] = useState(false);")

# 4. Modify the error block
OLD_ERROR = """  /* ── Error ── */
  if(error) return (
    <div style={{ maxWidth:520,margin:'80px auto',padding:48,textAlign:'center',background:'var(--bg-section)',borderRadius:28,border:'1px solid var(--border)' }}>
      <div style={{ width:72,height:72,margin:'0 auto 20px',background:'var(--non-compliant-bg)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' }}><AlertTriangle size={36} color="var(--non-compliant)"/></div>
      <h2 style={{ fontSize:'1.4rem',fontWeight:900,marginBottom:10,color:'var(--text-dark)' }}>Screening Error</h2>
      <p style={{ color:'var(--text-muted)',fontSize:'0.88rem',lineHeight:1.6,marginBottom:28 }}>{error}</p>
      <Link to="/portfolio#market" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'10px 22px',background:'var(--bg)',color:'var(--text-dark)',fontWeight:700,textDecoration:'none',borderRadius:100,border:'1px solid var(--border)' }}><ArrowLeft size={16}/> Back to Screener</Link>
    </div>
  );"""

NEW_ERROR = """  /* ── Error ── */
  if(error) {
    const isLimitError = error.toLowerCase().includes('limit');
    return (
      <div style={{ maxWidth:520,margin:'80px auto',padding:48,textAlign:'center',background:'var(--bg-section)',borderRadius:28,border:'1px solid var(--border)' }}>
        {showUpgradeModal && <PricingModal onClose={() => setShowUpgradeModal(false)} />}
        
        {isLimitError ? (
          <>
            <div style={{ width:72,height:72,margin:'0 auto 20px',background:'rgba(217,160,91,0.1)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Crown size={36} color="#B8860B"/>
            </div>
            <h2 style={{ fontSize:'1.4rem',fontWeight:900,marginBottom:10,color:'var(--text-dark)' }}>Upgrade to Unlock</h2>
            <p style={{ color:'var(--text-muted)',fontSize:'0.88rem',lineHeight:1.6,marginBottom:28 }}>{error}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/portfolio#market" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'12px 24px',background:'var(--bg)',color:'var(--text-dark)',fontWeight:700,textDecoration:'none',borderRadius:100,border:'1px solid var(--border)' }}>Back</Link>
              <button onClick={() => setShowUpgradeModal(true)} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'12px 28px',background:'var(--primary)',color:'#fff',fontWeight:700,border:'none',borderRadius:100,cursor:'pointer',boxShadow:'0 4px 14px rgba(0,0,0,0.1)' }}>
                View Plans <ArrowRight size={16}/>
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ width:72,height:72,margin:'0 auto 20px',background:'var(--non-compliant-bg)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' }}><AlertTriangle size={36} color="var(--non-compliant)"/></div>
            <h2 style={{ fontSize:'1.4rem',fontWeight:900,marginBottom:10,color:'var(--text-dark)' }}>Screening Error</h2>
            <p style={{ color:'var(--text-muted)',fontSize:'0.88rem',lineHeight:1.6,marginBottom:28 }}>{error}</p>
            <Link to="/portfolio#market" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'10px 22px',background:'var(--bg)',color:'var(--text-dark)',fontWeight:700,textDecoration:'none',borderRadius:100,border:'1px solid var(--border)' }}><ArrowLeft size={16}/> Back to Screener</Link>
          </>
        )}
      </div>
    );
  }"""

content = content.replace(OLD_ERROR, NEW_ERROR)

open('web/src/components/AaoifiScreening.jsx', 'w').write(content)
print("Updated AaoifiScreening")
