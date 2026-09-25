content = open('web/src/components/Pricing.jsx').read()

# Miftah button: if current plan, show "Your current plan"
content = content.replace(
  """<button onClick={() => handleSubscribe('free')} style={{ 
                width: '100%', padding: '10px', borderRadius: '100px', background: 'transparent', 
                border: '1px solid #D1D5DB', color: '#374151', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                marginBottom: '32px', transition: 'all 0.2s'
              }} className="hover-bg-gray">Get started</button>""",
  """{currentPlanSlug === 'free' && !hasPaid
                ? <div style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#F3F4F6', border: '1px solid #D1D5DB', color: '#6B7280', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', marginBottom: '32px' }}>✓ Your current plan</div>
                : <button onClick={() => handleSubscribe('free')} style={{ width: '100%', padding: '10px', borderRadius: '100px', background: 'transparent', border: '1px solid #D1D5DB', color: '#374151', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', marginBottom: '32px', transition: 'all 0.2s' }} className="hover-bg-gray">Get started</button>
              }"""
)

# Rawdah button: if current plan, show "Your current plan"
content = content.replace(
  """<button onClick={() => handleSubscribe('pro')} disabled={loading} style={{ 
                width: '100%', padding: '10px', borderRadius: '100px', background: '#006B46', 
                border: 'none', color: 'white', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '24px', transition: 'all 0.2s'
              }} className="hover-lift">{loading ? 'Processing...' : 'Get started'}</button>""",
  """{currentPlanSlug === 'pro' && hasPaid
                ? <div style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#E6F4EE', border: '2px solid #006B46', color: '#006B46', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', marginBottom: '24px' }}>✓ Your current plan</div>
                : <button onClick={() => handleSubscribe('pro')} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#006B46', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px', transition: 'all 0.2s' }} className="hover-lift">{loading ? 'Processing...' : 'Get started'}</button>
              }"""
)

# Noor button: if current plan, show "Your current plan"
content = content.replace(
  """<button onClick={() => handleSubscribe('max')} disabled={loading} style={{ 
                width: '100%', padding: '10px', borderRadius: '100px', background: '#D9A05B', 
                border: 'none', color: 'white', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '24px', transition: 'all 0.2s'
              }} className="hover-lift">{loading ? 'Processing...' : 'Get started'}</button>""",
  """{currentPlanSlug === 'max' && hasPaid
                ? <div style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#FEF5E7', border: '2px solid #D9A05B', color: '#B8860B', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', marginBottom: '24px' }}>✓ Your current plan</div>
                : <button onClick={() => handleSubscribe('max')} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: '100px', background: '#D9A05B', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px', transition: 'all 0.2s' }} className="hover-lift">{loading ? 'Processing...' : 'Get started'}</button>
              }"""
)

open('web/src/components/Pricing.jsx', 'w').write(content)
print("done")
