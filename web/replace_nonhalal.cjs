const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace tag: 'Non-Halal' or tag:'Non-Halal'
    content = content.replace(/tag\s*:\s*['"]Non-Halal['"]/gi, "tag: 'Shariah Non-Compliant'");
    
    // Replace user facing text in JSX elements
    content = content.replace(/>\s*❌\s*Non-Halal\s*</gi, ">❌ Shariah Non-Compliant<");
    content = content.replace(/>\s*→\s*Non-Halal only\s*</gi, ">→ Shariah Non-Compliant only<");
    content = content.replace(/>\s*Non-Halal\s*</gi, ">Shariah Non-Compliant<");
    
    // Look for other instances where it's quoted like label: 'Non-Halal'
    content = content.replace(/label\s*:\s*['"]Non-Halal['"]/gi, "label: 'Shariah Non-Compliant'");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
