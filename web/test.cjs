const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('pageerror', err => {
    console.log('Page error: ', err.toString());
  });
  page.on('console', msg => {
    if(msg.type() === 'error') console.log('Console error: ', msg.text());
  });
  await page.goto('http://127.0.0.1:4173/portfolio#purification', { waitUntil: 'networkidle2' });
  await browser.close();
  process.exit(0);
})();
