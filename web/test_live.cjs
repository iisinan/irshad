const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://iirshad.com/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'test@example.com');
  await page.type('input[type="password"]', 'password');
  await page.click('.btn-primary');
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  
  await page.goto('https://iirshad.com/market/CAVERTON', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.content();
  console.log(html.substring(0, 500) + '... (truncated)');
  
  const hasError = await page.evaluate(() => document.body.innerText.includes('Something went wrong'));
  console.log('Has Error Boundary:', hasError);
  
  const hasInstitutional = await page.evaluate(() => document.body.innerText.includes('Institutional AAOIFI Analysis'));
  console.log('Has Loading Spinner:', hasInstitutional);
  
  const hasNonHalal = await page.evaluate(() => document.body.innerText.includes('NON-HALAL'));
  console.log('Has Non-Halal verdict:', hasNonHalal);
  
  await browser.close();
})();
