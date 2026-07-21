const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // Set viewport to a square large enough for high-res icon
  await page.setViewport({ width: 1024, height: 1024 });

  // Use the logo.svg this time!
  const svgPath = 'file://' + path.resolve('../web/public/logo.svg');
  
  // We want pure transparency, no background color.
  await page.goto(svgPath);

  // Take screenshot with omitBackground: true
  await page.screenshot({ 
    path: 'assets/app_icon.png', 
    omitBackground: true 
  });

  await browser.close();
})();
