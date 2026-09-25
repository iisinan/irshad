import re

content = open('web/src/components/Pricing.jsx').read()

miftah_old = """            {/* MIFTAH */}
            <div style={{ 
              background: '#F0F7FF', borderRadius: '16px', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', boxShadow: '0 12px 40px rgba(184, 134, 11, 0.08)',
              border: '1px solid #D1E5FF'
            }}>"""

miftah_new = """            {/* MIFTAH */}
            <div style={{ background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)' }}>"""
            
content = content.replace(miftah_old, miftah_new)


rawdah_old = """            {/* RAWDAH */}
            <div style={{ 
              background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,107,70,0.2)',
              border: '3px solid #006B46', transform: 'scale(1.05)', position: 'relative', zIndex: 10
            }}>"""
            
rawdah_new = """            {/* RAWDAH */}
            <div className="pricing-pro-card" style={{ background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,107,70,0.15)', border: '3px solid #006B46', position: 'relative', zIndex: 10 }}>"""

content = content.replace(rawdah_old, rawdah_new)


noor_old = """            {/* NOOR */}
            <div style={{ 
              background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', boxShadow: '0 12px 40px rgba(184, 134, 11, 0.08)',
              border: '1px solid #EADDCD', position: 'relative'
            }}>"""

noor_new = """            {/* NOOR */}
            <div style={{ background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 40px rgba(184, 134, 11, 0.08)', border: '1px solid #EADDCD', position: 'relative' }}>"""

content = content.replace(noor_old, noor_new)


with open('web/src/components/Pricing.jsx', 'w') as f:
    f.write(content)
print("done")
