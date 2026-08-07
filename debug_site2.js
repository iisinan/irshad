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
    
    console.log("Navigating to https://iirshad.com/ ...");
    await page.goto('https://iirshad.com/', { waitUntil: 'networkidle0' });
    
    console.log("Page title:", await page.title());
    
    const rootHtml = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root ? root.innerHTML.substring(0, 500) : 'NO ROOT ELEMENT FOUND';
    });
    console.log("Root element HTML snippet:", rootHtml);
    
    await browser.close();
  } catch (error) {
    console.error("Puppeteer Error:", error);
  }
})();
