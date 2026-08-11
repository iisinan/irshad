const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx';
const workbook = XLSX.readFile(filePath);
console.log("Sheets in Excel: " + workbook.SheetNames.length);

const doubtful = [];

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
    let status = null;
    
    // Look for status row
    for(let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row && row[0]) {
            const col0 = String(row[0]).toLowerCase().trim();
            if (col0.includes('business_status') || col0.includes('status')) {
                status = row[1];
                break;
            }
        }
    }
    
    console.log(`Sheet: ${sheetName}, Status: ${status}`);
    if (status && String(status).toLowerCase().includes('doubtful')) {
        doubtful.push(sheetName);
    }
});
console.log("Doubtful stocks: ", doubtful);
