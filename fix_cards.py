import re

content = open('web/src/components/Pricing.jsx').read()

# Fix Miftah
content = re.sub(
    r"\{\/\* MIFTAH \*\/\}.*?<div style=\{\{[\s\S]*?\}\}>",
    " {/* MIFTAH */}\n            <div style={{ background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)' }}>",
    content, count=1
)
content = re.sub(
    r"<div style=\{\{ background: '#0A5B9C'.*?\}\}>",
    "<div style={{ background: 'linear-gradient(135deg, #0A192F, #0A5B9C)', color: 'white', textAlign: 'center', padding: '36px 20px 32px' }}>",
    content, count=1
)

# Fix Rawdah
content = re.sub(
    r"\{\/\* RAWDAH \*\/\}.*?<div style=\{\{[\s\S]*?\}\}>",
    " {/* RAWDAH */}\n            <div style={{ background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,107,70,0.15)', border: '3px solid #006B46', transform: 'scale(1.03)', position: 'relative', zIndex: 10 }}>",
    content, count=1
)
content = re.sub(
    r"<div style=\{\{ background: '#006B46'.*?\}\}>",
    "<div style={{ background: 'linear-gradient(135deg, #004d32, #006B46)', color: 'white', textAlign: 'center', padding: '36px 20px 32px' }}>",
    content, count=1
)

# Fix Noor
content = re.sub(
    r"\{\/\* NOOR \*\/\}.*?<div style=\{\{[\s\S]*?\}\}>",
    " {/* NOOR */}\n            <div style={{ background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 40px rgba(184,134,11,0.08)', border: '1px solid #EADDCD', position: 'relative' }}>",
    content, count=1
)
content = re.sub(
    r"<div style=\{\{ background: '#B8860B'.*?\}\}>",
    "<div style={{ background: 'linear-gradient(135deg, #8B6508, #B8860B)', color: 'white', textAlign: 'center', padding: '36px 20px 32px' }}>",
    content, count=1
)

with open('web/src/components/Pricing.jsx', 'w') as f:
    f.write(content)
print("done")
