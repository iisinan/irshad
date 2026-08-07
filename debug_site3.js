const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    page.on('response', response => {
      if (!response.ok() && response.url().includes('api')) {
        console.log('FAILED API REQUEST:', response.url(), response.status());
      }
    });
    
    console.log("Navigating to https://iirshad.com/ ...");
    await page.goto('https://iirshad.com/', { waitUntil: 'networkidle0' });
    
    // Let's also try to navigate to /market/JAIZBANK just in case
    console.log("Navigating to https://iirshad.com/market/JAIZBANK ...");
    await page.goto('https://iirshad.com/market/JAIZBANK', { waitUntil: 'networkidle0' });
    
    console.log("Page title:", await page.title());
    await browser.close();
  } catch (error) {
    console.error("Puppeteer Error:", error);
  }
})();
