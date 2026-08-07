const xlsx = require('xlsx');
const workbook = xlsx.readFile('/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx');
workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  console.log(`\n--- Sheet: ${sheetName} ---`);
  
  if (data.length > 0) {
    // Look for rows where any column contains the word 'Doubtful' (case-insensitive)
    const doubtfulRows = data.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes('doubtful')
      );
    });
    
    if (doubtfulRows.length > 0) {
      console.log(`Found ${doubtfulRows.length} doubtful stocks:`);
      doubtfulRows.forEach(row => {
        // Assume 'Ticker' or similar is the first column, print it
        const firstKey = Object.keys(row)[0];
        console.log(`- ${row[firstKey]} | ${JSON.stringify(row)}`);
      });
    } else {
      console.log("No doubtful stocks found in this sheet.");
    }
  }
});
