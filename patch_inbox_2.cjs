const fs = require('fs');
let file = fs.readFileSync('web/src/components/portfolio/UpdatesInbox.jsx', 'utf8');

file = file.replace(/const NotifCard = \({ notif, onRead, onArchive, onDelete }\) => {/,
  "const NotifCard = ({ notif, onRead, onArchive, onDelete, onCardClick }) => {");

file = file.replace(/position: 'relative',\n    }}/g,
  "position: 'relative',\n      cursor: onCardClick ? 'pointer' : 'default',\n    }}");

file = file.replace(/onMouseLeave=\{e => \{ e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = isUnread \? `color-mix\(in srgb, \$\{cfg.color\} 20%, var\(--border\)\)` : 'var\(--border\)'; \}\}\n    >/,
  "onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = isUnread ? `color-mix(in srgb, ${cfg.color} 20%, var(--border))` : 'var(--border)'; }}\n      onClick={(e) => { if (onCardClick) onCardClick(notif); }}\n    >");

file = file.replace(/system:            \{ icon: Settings,   color: 'var\(--text-muted\)', bg: 'var\(--bg-section\)', label: 'System' \},/,
  "system:            { icon: Settings,   color: 'var(--text-muted)', bg: 'var(--bg-section)', label: 'System' },\n  digest:            { icon: Mail,       color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', label: 'Digest' },");

fs.writeFileSync('web/src/components/portfolio/UpdatesInbox.jsx', file);
