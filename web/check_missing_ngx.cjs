const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    let allTickers = new Set();
    
    // 1. Sectors page
    await page.goto('https://ngxpulse.ng/sectors', { waitUntil: 'networkidle2' });
    const sectorTickers = await page.evaluate(() => {
        // Tickers are usually in the first column of the table, or have specific classes
        // In the HTML we saw earlier: table.stocks a.stk contains the ticker
        const links = Array.from(document.querySelectorAll('table.stocks a.stk'));
        return links.map(a => a.textContent.trim());
    });
    sectorTickers.forEach(t => allTickers.add(t));
    console.log(`Found ${sectorTickers.length} tickers on sectors page`);
    
    // 2. ETFs page
    await page.goto('https://ngxpulse.ng/etfs', { waitUntil: 'networkidle2' });
    const etfTickers = await page.evaluate(() => {
        // Assuming ETFs use similar markup or we can grab the tickers
        const links = Array.from(document.querySelectorAll('table a.stk'));
        if (links.length > 0) return links.map(a => a.textContent.trim());
        // Fallback: search for bold text in first column
        const rows = Array.from(document.querySelectorAll('table tr'));
        return rows.map(tr => {
            const td = tr.querySelector('td');
            return td ? td.textContent.trim().split('\n')[0] : null;
        }).filter(t => t);
    });
    etfTickers.forEach(t => allTickers.add(t));
    console.log(`Found ${etfTickers.length} tickers on ETFs page`);
    
    await browser.close();
    
    const tickersArray = Array.from(allTickers).filter(t => t);
    console.log("Total unique tickers on NGX Pulse:", tickersArray.length);
    fs.writeFileSync('/tmp/ngx_pulse_tickers.json', JSON.stringify(tickersArray));
})();
