const fs = require('fs');
let file = fs.readFileSync('web/src/components/portfolio/UpdatesInbox.jsx', 'utf8');

file = file.replace(/system: { icon: Settings, color: 'var\(--text-muted\)', bg: 'var\(--bg-section\)', label: 'System' },/,
  "system:            { icon: Settings,   color: 'var(--text-muted)', bg: 'var(--bg-section)', label: 'System' },\n  digest:            { icon: Mail,       color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', label: 'Digest' },");

file = file.replace(/const NotifCard = \({ notif, onRead, onArchive, onDelete }\) => {/,
  "const NotifCard = ({ notif, onRead, onArchive, onDelete, onCardClick }) => {");

file = file.replace(/onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = isUnread \? `color-mix\(in srgb, \$\{cfg.color\} 20%, var\(--border\)\)` : 'var\(--border\)'; }}\n    >/,
  "onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = isUnread ? `color-mix(in srgb, ${cfg.color} 20%, var(--border))` : 'var(--border)'; }}\n      onClick={(e) => { if (onCardClick) onCardClick(notif); }}\n      style={{ cursor: onCardClick ? 'pointer' : 'default', ...((arguments[0] || {}).style || {}) }}\n    >");

// Note: style is already provided as an inline prop to the div, so we need to inject the cursor inside the existing style object.
// Wait, the div looks like:
// <div className="animate-slide-up" style={{
//   background: ...

// Let's use a regex to add cursor: onCardClick ? 'pointer' : 'default', inside the style
