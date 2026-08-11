const XLSX = require('xlsx');
const filePath = '/Users/sinan/Downloads/Irshad Stock Screening data_bzctv.xlsx';
const workbook = XLSX.readFile(filePath);

const sheet = workbook.Sheets['Doubtful Stocks'];
if (sheet) {
    const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
    console.log("--- Doubtful Stocks in Doubtful Stocks Sheet ---");
    const headerRow = data[4];
    data.slice(5).forEach(row => {
        if (row[2] && String(row[2]).toUpperCase() === 'DOUBTFUL') {
            console.log(`${row[0]}: ${row[3]}`);
        }
    });
}
