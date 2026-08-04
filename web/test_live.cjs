const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('Console:', msg.text()));
  page.on('pageerror', err => console.log('Page error:', err.toString()));
  await page.goto('https://iirshad.com/', { waitUntil: 'networkidle0', timeout: 30000 });
  
  const content = await page.content();
  console.log("Found app:", content.includes('<div id="root">'));
  
  await browser.close();
})();
