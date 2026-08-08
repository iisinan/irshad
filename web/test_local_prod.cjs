const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:4173/market/AIRTELAFRI', { waitUntil: 'networkidle0' });
  const html = await page.content();
  console.log(html.substring(0, 500) + '... (truncated)');
  
  const hasError = await page.evaluate(() => document.body.innerText.includes('Cannot read properties of undefined'));
  console.log('Has Error:', hasError);
  
  const errorText = await page.evaluate(() => document.body.innerText);
  require('fs').writeFileSync('/tmp/local_prod_text.txt', errorText);
  
  await browser.close();
})();
