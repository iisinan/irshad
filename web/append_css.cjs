const fs = require('fs');
const css = `

/* ===================================================
   GLASSMORPHISM ENHANCEMENTS
   =================================================== */
.feature-card, .news-card, .stock-card, .holding-card, .holding-card-v2, .syi-card, .glass-panel {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
`;
fs.appendFileSync('src/index.css', css);
console.log('Appended glassmorphism CSS!');
