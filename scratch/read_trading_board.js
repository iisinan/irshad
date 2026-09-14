const xlsx = require('xlsx');
const files = [
  { path: '/Users/sinan/Downloads/Halal.xlsx' },
  { path: '/Users/sinan/Downloads/Non halal.xlsx' },
  { path: '/Users/sinan/Downloads/Doubtful Stocks.xlsx' },
];
const results = {};
for (const f of files) {
  const workbook = xlsx.readFile(f.path);
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
  let headerRowIdx = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i] && typeof data[i][0] === 'string' && data[i][0].trim() === 'Ticker') { headerRowIdx = i; break; }
  }
  if (headerRowIdx === -1) continue;
  const headers = data[headerRowIdx];
  let tbCol = headers.findIndex(h => h && h.toString().toLowerCase().includes('trading'));
  if (tbCol === -1) continue;
  for (const row of data.slice(headerRowIdx + 1)) {
    if (!row || !row[0]) continue;
    const ticker = String(row[0]).trim();
    if (!ticker) continue;
    const tb = row[tbCol] ? String(row[tbCol]).trim() : '';
    if (tb) results[ticker] = tb;
  }
}
console.log(JSON.stringify(results));
