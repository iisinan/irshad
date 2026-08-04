const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
  );
  
  console.log("Loading page...");
  await page.goto('http://127.0.0.1:5174/portfolio#zakat', { waitUntil: 'networkidle2' });
  console.log("Page loaded");
  
  await browser.close();
})();
