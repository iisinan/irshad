const fs = require('fs');
const file = 'web/src/components/StockDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("if (reason && reason.includes('|||'))")) {
    content = content.replace(
        'reason = formatAppJustification(reason, isNonHalal);',
        `reason = formatAppJustification(reason, isNonHalal);\n\n  if (reason && reason.includes('|||')) {\n    const parts = reason.split('|||');\n    reason = parts[0].trim() + ' ' + parts[1].trim();\n  }`
    );
    fs.writeFileSync(file, content);
    console.log("Patched StockDetails.jsx");
} else {
    console.log("StockDetails.jsx already patched.");
}
