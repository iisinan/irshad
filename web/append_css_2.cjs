const fs = require('fs');
const css = `

/* ===================================================
   PREMIUM CUSTOM SCROLLBAR
   =================================================== */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--primary-light);
}
`;
fs.appendFileSync('src/index.css', css);
console.log('Appended scrollbar CSS!');
