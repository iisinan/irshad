const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    page.on('response', response => {
      if (!response.ok()) {
        console.log('FAILED REQUEST:', response.url(), response.status());
      }
    });

    console.log("Navigating to https://iirshad.com/ ...");
    await page.goto('https://iirshad.com/', { waitUntil: 'networkidle2' });
    
    console.log("Page title:", await page.title());
    await browser.close();
  } catch (error) {
    console.error("Puppeteer Error:", error);
  }
})();
