const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('./NGX_Shariah_Screen.xlsx');
const sheet_name_list = workbook.SheetNames;

const result = {};
sheet_name_list.forEach(function(y) {
    const worksheet = workbook.Sheets[y];
    result[y] = xlsx.utils.sheet_to_json(worksheet);
});

fs.writeFileSync('output.json', JSON.stringify(result, null, 2));
console.log('Successfully written to output.json');
