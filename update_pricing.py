import re

content = open('web/src/components/Pricing.jsx').read()

# Replace the toggle
toggle_old = """            <div style={{ 
              display: 'inline-flex', background: '#E2E8F0', borderRadius: '100px', padding: '4px', margin: '20px auto'
            }}>
              <button 
                onClick={() => setBillingCycle('monthly')}
                style={{ 
                  padding: '10px 24px', borderRadius: '100px', border: 'none', 
                  background: billingCycle === 'monthly' ? '#fff' : 'transparent',
                  color: billingCycle === 'monthly' ? '#0F172A' : '#64748B',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: billingCycle === 'monthly' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                style={{ 
                  padding: '10px 24px', borderRadius: '100px', border: 'none', 
                  background: billingCycle === 'yearly' ? '#fff' : 'transparent',
                  color: billingCycle === 'yearly' ? '#0F172A' : '#64748B',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: billingCycle === 'yearly' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Yearly (Save ~10%)
              </button>
            </div>"""
            
toggle_new = """            <div style={{ 
              display: 'inline-flex', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '100px', padding: '6px', margin: '20px auto', position: 'relative'
            }}>
              <button 
                onClick={() => setBillingCycle('monthly')}
                style={{ 
                  position: 'relative', zIndex: 1, padding: '10px 28px', borderRadius: '100px', border: 'none', 
                  background: billingCycle === 'monthly' ? 'var(--bg)' : 'transparent',
                  color: billingCycle === 'monthly' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                  boxShadow: billingCycle === 'monthly' ? '0 4px 14px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                style={{ 
                  position: 'relative', zIndex: 1, padding: '10px 28px', borderRadius: '100px', border: 'none', 
                  background: billingCycle === 'yearly' ? 'var(--bg)' : 'transparent',
                  color: billingCycle === 'yearly' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: billingCycle === 'yearly' ? '0 4px 14px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                Yearly <span style={{ background: '#10B981', color: 'white', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Save ~10%</span>
              </button>
            </div>"""

content = content.replace(toggle_old, toggle_new)


# Fix the card container for staggering
content = content.replace('<div className="pricing-grid"', '<div className="pricing-grid stagger-fade-in"')

# Replace FeatureRow styling
feature_old = """  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ 
        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        color: '#0A192F', flexShrink: 0 
      }}>
        <IconComponent size={24} color="#0A192F" />
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0A192F', marginBottom: '4px' }}>{title}</div>
        {text && <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>{text}</div>}
      </div>
    </li>
  );"""

feature_new = """  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 0', borderBottom: '1px dashed rgba(0,0,0,0.08)' }}>
      <div style={{ 
        width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        background: 'rgba(10, 25, 47, 0.04)', borderRadius: '8px', color: '#0A192F', flexShrink: 0 
      }}>
        <IconComponent size={16} strokeWidth={2.5} color="#0A192F" />
      </div>
      <div style={{ paddingTop: '2px' }}>
        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0A192F', marginBottom: '2px' }}>{title}</div>
        {text && <div style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.4, fontWeight: 500 }}>{text}</div>}
      </div>
    </li>
  );"""

content = content.replace(feature_old, feature_new)


# Update the background of cards and styling
# MIFTAH
content = content.replace("background: '#F8FAFC', borderRadius: '16px', overflow: 'hidden'", "background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden'")
content = content.replace("boxShadow: '0 4px 20px rgba(0,0,0,0.03)'", "boxShadow: '0 8px 30px rgba(0,0,0,0.04)'")
content = content.replace("background: '#0A192F', color: 'white', textAlign: 'center', padding: '24px 20px'", "background: '#0A192F', color: 'white', textAlign: 'center', padding: '32px 20px'")

# RAWDAH
content = content.replace("background: '#E6F4F1', borderRadius: '16px', overflow: 'hidden',", "background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden',")
content = content.replace("boxShadow: '0 16px 40px rgba(0,107,70,0.15)',", "boxShadow: '0 20px 50px rgba(0,107,70,0.2)',")
content = content.replace("border: '2px solid #006B46', transform: 'scale(1.02)', position: 'relative', zIndex: 10", "border: '3px solid #006B46', transform: 'scale(1.05)', position: 'relative', zIndex: 10")
content = content.replace("<h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>RAWDAH (PRO)</h3>", "<div style={{ background: '#D9A05B', color: '#fff', fontSize: '0.75rem', fontWeight: 900, padding: '6px 14px', borderRadius: '100px', display: 'inline-block', marginBottom: '16px', letterSpacing: '1px' }}>MOST POPULAR</div><h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '8px' }}>RAWDAH (PRO)</h3>")

# NOOR
content = content.replace("background: '#FFF8E7', borderRadius: '16px', overflow: 'hidden',", "background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden',")
content = content.replace("boxShadow: '0 10px 30px rgba(0,0,0,0.05)',", "boxShadow: '0 12px 40px rgba(184, 134, 11, 0.08)',")
content = content.replace("border: '1px solid #EADDCD'", "border: '1px solid #EADDCD', position: 'relative'")
content = content.replace("<h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>NOOR (MAX)</h3>", "<div style={{ position: 'absolute', top: 0, right: 0, background: '#B8860B', color: 'white', padding: '4px 30px', transform: 'translate(28px, 16px) rotate(45deg)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>BEST VALUE</div><h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>NOOR (MAX)</h3>")


# Add transition class to all card buttons to make them pop on hover
content = content.replace('className="hover-lift"', 'className="hover-lift pricing-btn"')

with open('web/src/components/Pricing.jsx', 'w') as f:
    f.write(content)
print("done")
