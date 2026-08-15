const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Check if it's on the stock page or ETF page
    await page.goto('https://ngxpulse.ng/etfs', { waitUntil: 'networkidle2' });
    
    // Find LOTUSHAL15 in the table and grab its row data
    const etfData = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tr'));
        for (const tr of rows) {
            if (tr.textContent.includes('LOTUSHAL15')) {
                const tds = Array.from(tr.querySelectorAll('td'));
                return tds.map(td => td.textContent.trim());
            }
        }
        return null;
    });
    
    console.log("ETF Table Data for LOTUSHAL15:", etfData);
    
    // Try to visit its specific page to get market cap etc if possible
    let detailData = null;
    try {
        await page.goto('https://ngxpulse.ng/etfs/lotushal15', { waitUntil: 'networkidle2' });
        detailData = await page.evaluate(() => {
            const stats = Array.from(document.querySelectorAll('.stat'));
            const result = {};
            stats.forEach(stat => {
                const label = stat.querySelector('.stat-label')?.textContent.trim();
                const val = stat.querySelector('.stat-val')?.textContent.trim();
                if (label && val) result[label] = val;
            });
            return result;
        });
        console.log("ETF Detail Page Stats:", detailData);
    } catch(e) {
        console.log("Could not load detail page for LOTUSHAL15");
    }

    await browser.close();
})();
