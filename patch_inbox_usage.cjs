const fs = require('fs');
let file = fs.readFileSync('web/src/components/portfolio/UpdatesInbox.jsx', 'utf8');

file = file.replace(/const \[showDigestModal, setShowDigestModal\] = useState\(false\);/,
  "const [showDigestModal, setShowDigestModal] = useState(false);\n  const [selectedDigest, setSelectedDigest] = useState(null);");

file = file.replace(/<NotifCard\n                key=\{notif\.id\}\n                notif=\{notif\}\n                onRead=\{handleRead\}\n                onArchive=\{handleArchive\}\n                onDelete=\{handleDelete\}\n              \/>/g,
  `<NotifCard\n                key={notif.id}\n                notif={notif}\n                onRead={handleRead}\n                onArchive={handleArchive}\n                onDelete={handleDelete}\n                onCardClick={(n) => {\n                  if (n.category === 'digest' || n.title === 'Irshad Digest is Ready') {\n                    setSelectedDigest(n);\n                    if (!n.read_at) handleRead(n.id);\n                  }\n                }}\n              />`);

file = file.replace(/\{showDigestModal && \(/,
  `{selectedDigest && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div className="animate-slide-up" style={{
            background: 'var(--bg)', borderRadius: '24px', 
            width: '100%', maxWidth: '600px', position: 'relative',
            boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', maxHeight: '90vh'
          }}>
            <button 
              onClick={() => setSelectedDigest(null)}
              style={{ 
                position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)',
                border: '1px solid rgba(0,0,0,0.1)', borderRadius: '50%', padding: '6px',
                cursor: 'pointer', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <X size={18} />
            </button>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <UpdatesDigestViewer meta={selectedDigest.meta} />
            </div>
          </div>
        </div>
      )}

      {showDigestModal && (`);

fs.writeFileSync('web/src/components/portfolio/UpdatesInbox.jsx', file);
