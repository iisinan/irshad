const xlsx = require('xlsx');
const workbook = xlsx.readFile('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx');
const sheet = workbook.Sheets['All Stocks'];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1});

const headers = data[3];
const tickerIdx = headers.indexOf('Ticker');
const statusIdx = headers.indexOf('Business Activity Screen');

let doubtfulCount = 0;
let nonHalalCount = 0;
let doubtfulTickers = [];
let nonHalalTickers = [];

for (let i = 4; i < data.length; i++) {
  const row = data[i];
  if (!row[tickerIdx]) continue;
  
  const status = String(row[statusIdx]).trim().toUpperCase();
  
  if (status === 'DOUBTFUL') {
    doubtfulTickers.push(row[tickerIdx]);
  } else if (status === 'NON-HALAL' || status === 'FAIL' || status === 'NON HALAL') {
    nonHalalTickers.push({ticker: row[tickerIdx], status: status});
  }
}

console.log(`Found ${doubtfulTickers.length} DOUBTFUL stocks:`);
console.log(doubtfulTickers.join(', '));

console.log(`\nFound ${nonHalalTickers.length} NON-HALAL stocks:`);
nonHalalTickers.forEach(s => console.log(`${s.ticker} (${s.status})`));

// Check if any of my previously listed 18 stocks are actually Non-Halal
const previousList = ['AFROMEDIA', 'BETAGLAS', 'CILEASING', 'DAARCOMM', 'HMCALL', 'NAHCO', 'NCR', 'NGXGROUP', 'SFSREIT', 'TANTALIZER', 'TRANSCORP', 'UHOMREIT', 'UPDCREIT', 'NEWGOLD', 'VETGOODS', 'VETINDETF', 'MERGROWTH', 'MERVALUE'];

console.log(`\nChecking previous 18 list against actual status:`);
for (let i = 4; i < data.length; i++) {
  const row = data[i];
  if (!row[tickerIdx]) continue;
  
  if (previousList.includes(row[tickerIdx])) {
     console.log(`${row[tickerIdx]} -> ${row[statusIdx]}`);
  }
}
