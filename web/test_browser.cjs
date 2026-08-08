const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (!response.ok()) console.log('HTTP ERROR:', response.status(), response.url());
  });

  try {
    await page.goto('http://localhost:5173/market/CAVERTON', { waitUntil: 'networkidle2', timeout: 10000 });
    const title = await page.title();
    console.log('Title:', title);
    
    // Wait for the app to render something
    await new Promise(r => setTimeout(r, 2000)); //(2000);
    
    // Check if there is an error boundary message or stock not found
    const content = await page.content();
    if (content.includes('Something went wrong')) {
      console.log('FOUND ErrorBoundary!');
    } else if (content.includes('Stock not found')) {
      console.log('FOUND Stock not found screen.');
    } else {
      console.log('Rendered normally.');
    }
  } catch (err) {
    console.error('Script Error:', err.message);
  } finally {
    await browser.close();
  }
})();
