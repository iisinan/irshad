const xlsx = require('xlsx');
const fs = require('fs');
const workbook = xlsx.readFile('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx');
const sheet = workbook.Sheets['All Stocks'];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1});

const headers = data[3];
const tickerIdx = headers.indexOf('Ticker');
const statusIdx = headers.indexOf('Business Activity Screen');
const rationaleIdx = headers.indexOf('Rationale');

let doubtfulData = [];

for (let i = 4; i < data.length; i++) {
  const row = data[i];
  if (!row[tickerIdx]) continue;
  
  const status = String(row[statusIdx]).trim().toUpperCase();
  
  if (status === 'DOUBTFUL') {
    doubtfulData.push({
      ticker: row[tickerIdx],
      rationale: row[rationaleIdx] || ""
    });
  }
}

fs.writeFileSync('doubtful_data.json', JSON.stringify(doubtfulData, null, 2));
console.log(`Saved ${doubtfulData.length} records to doubtful_data.json`);
