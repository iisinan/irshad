import re

content = open('web/src/components/portfolio/UpdatesNews.jsx').read()

# Add ArrowLeft import if not present
if "ArrowLeft" not in content:
    content = content.replace("import { ExternalLink, X, RefreshCw, AlertCircle } from 'lucide-react';", "import { ExternalLink, X, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';")
    content = content.replace("import { ExternalLink, RefreshCw, AlertCircle, X } from 'lucide-react';", "import { ExternalLink, RefreshCw, AlertCircle, X, ArrowLeft } from 'lucide-react';")

iframe_old = """      {selectedUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 24px', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>News Article</div>
            <button onClick={() => setSelectedUrl(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dark)', padding: '4px' }}>
              <X size={22} />
            </button>
          </div>
          <iframe 
            src={selectedUrl} 
            style={{ flex: 1, border: 'none', width: '100%', background: '#fff' }} 
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms" 
            title="News Article"
          />
        </div>
      )}"""

iframe_new = """      {selectedUrl && (
        <div className="animate-slide-up" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--bg)', zIndex: 99999, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <button 
              onClick={() => setSelectedUrl(null)} 
              className="hover-lift"
              style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '100px', cursor: 'pointer', color: 'var(--text-dark)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> Back to Market Intelligence
            </button>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reader View</div>
          </div>
          <div style={{ flex: 1, WebkitOverflowScrolling: 'touch', overflowY: 'auto' }}>
            <iframe 
              src={selectedUrl} 
              style={{ display: 'block', border: 'none', width: '100%', height: '100%', background: '#fff' }} 
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms" 
              title="News Article Reader"
            />
          </div>
        </div>
      )}"""

content = content.replace(iframe_old, iframe_new, 1)

with open('web/src/components/portfolio/UpdatesNews.jsx', 'w') as f:
    f.write(content)
print("done")
