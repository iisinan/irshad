const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    let allTickers = new Set();
    
    // 1. Get all sector links
    await page.goto('https://ngxpulse.ng/sectors', { waitUntil: 'networkidle2' });
    const sectorLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href^="/sectors/"]'));
        return Array.from(new Set(links.map(a => a.href)));
    });
    
    console.log(`Found ${sectorLinks.length} sectors.`);
    
    for (const link of sectorLinks) {
        await page.goto(link, { waitUntil: 'networkidle2' });
        const tickers = await page.evaluate(() => {
            const stkLinks = Array.from(document.querySelectorAll('table a.stk, a[href^="/stock/"]'));
            return stkLinks.map(a => a.href.split('/').pop().toUpperCase());
        });
        tickers.forEach(t => allTickers.add(t));
        console.log(`- ${link}: added ${tickers.length} tickers`);
    }
    
    // 2. ETFs page
    await page.goto('https://ngxpulse.ng/etfs', { waitUntil: 'networkidle2' });
    const etfTickers = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('table a.stk, a[href^="/stock/"], a[href^="/etfs/"]'));
        return links.map(a => {
            const p = a.href.split('/');
            return p[p.length - 1].toUpperCase();
        });
    });
    etfTickers.forEach(t => allTickers.add(t));
    console.log(`Found ${etfTickers.length} tickers on ETFs page`);
    
    await browser.close();
    
    const tickersArray = Array.from(allTickers).filter(t => t);
    console.log("Total unique tickers on NGX Pulse:", tickersArray.length);
    fs.writeFileSync('/tmp/ngx_pulse_tickers.json', JSON.stringify(tickersArray));
})();
