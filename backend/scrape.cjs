const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Navigate to Simply Wall St Nigerian screener
  await page.goto('https://simplywall.st/stocks/ng', { waitUntil: 'networkidle' });

  // Wait for the table or list to load
  try {
    await page.waitForSelector('table', { timeout: 10000 });
  } catch (e) {
    console.log('No table found or timeout');
  }

  // Evaluate script to extract data
  const data = await page.evaluate(() => {
    const results = [];
    // This selector depends on the actual site structure, trying a generic approach
    // We will look for elements that look like tickers/companies
    const rows = document.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length > 2) {
        const company = cells[0].innerText.trim();
        const sector = cells[1] ? cells[1].innerText.trim() : '';
        const industry = cells[2] ? cells[2].innerText.trim() : '';
        if (company) {
          results.push({ company, sector, industry });
        }
      }
    });
    return results;
  });

  console.log(`Extracted ${data.length} records.`);
  
  fs.writeFileSync('simplywallst_sectors.json', JSON.stringify(data, null, 2));

  await browser.close();
})();
