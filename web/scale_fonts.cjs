const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Decrease rem values by 12% (multiply by 0.88)
      content = content.replace(/fontSize\s*:\s*['"]?([0-9.]+)rem['"]?/g, (match, p1) => {
        const newSize = (parseFloat(p1) * 0.88).toFixed(2).replace(/\.?0+$/, '');
        return `fontSize: '${newSize}rem'`;
      });
      
      content = content.replace(/font-size\s*:\s*([0-9.]+)rem/g, (match, p1) => {
        const newSize = (parseFloat(p1) * 0.88).toFixed(2).replace(/\.?0+$/, '');
        return `font-size: ${newSize}rem`;
      });

      // Decrease px values by ~2px
      content = content.replace(/fontSize\s*:\s*['"]?([0-9.]+)px['"]?/g, (match, p1) => {
        let newSize = parseFloat(p1);
        if (newSize > 14) newSize -= 2;
        else if (newSize > 10) newSize -= 1;
        newSize = newSize.toFixed(1).replace(/\.?0+$/, '');
        return `fontSize: '${newSize}px'`;
      });
      
      content = content.replace(/font-size\s*:\s*([0-9.]+)px/g, (match, p1) => {
        let newSize = parseFloat(p1);
        if (newSize > 14) newSize -= 2;
        else if (newSize > 10) newSize -= 1;
        newSize = newSize.toFixed(1).replace(/\.?0+$/, '');
        return `font-size: ${newSize}px`;
      });

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir('src');
console.log('Font sizes scaled down!');
