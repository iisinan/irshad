const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/padding-left: 72px;/g, 'padding-left: 80px;');
fs.writeFileSync('src/index.css', css);
console.log('Fixed padding to 80px');
