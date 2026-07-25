const { webkit } = require('playwright');

(async () => {
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const logs = [];
  const networkErrors = [];

  page.on('console', msg => {
    logs.push(`[Console ${msg.type()}] ${msg.text()}`);
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push(`[Network Error] ${response.status()} ${response.url()}`);
    }
  });

  console.log('Navigating to http://localhost:5174/admin/resources...');
  await page.goto('http://localhost:5174/admin/resources');

  const url = page.url();
  console.log('Current URL:', url);

  if (url.includes('/login')) {
    console.log('Logging in...');
    await page.fill('input[type="email"]', 'sinanismailaidris@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // wait for navigation back to admin/resources
    await page.waitForURL('**/admin/resources');
    console.log('Logged in and navigated to resources page.');
  }

  // Clear previous logs before action
  logs.length = 0;
  networkErrors.length = 0;

  // Let the page settle
  await page.waitForTimeout(2000);

  // Find the button with Plus icon
  // Sometimes it's a button containing an SVG with specific class or just aria-label
  // We'll look for "Add Resource" text or a button. 
  // The user says "click the 'Add Resource' button (it has a Plus icon)"
  console.log('Looking for Add Resource button...');
  const addResourceBtn = page.getByRole('button', { name: /add resource/i });
  const count = await addResourceBtn.count();
  
  if (count === 0) {
    // maybe try looking for a button that contains text "Add Resource"
    const fallbackBtn = page.locator('button:has-text("Add Resource")');
    if (await fallbackBtn.count() > 0) {
      console.log('Clicking fallback button...');
      await fallbackBtn.first().click();
    } else {
      console.log('Could not find Add Resource button. Dumping HTML...');
      console.log(await page.content());
    }
  } else {
    console.log('Clicking Add Resource button...');
    await addResourceBtn.first().click();
  }

  // Wait to see what happens
  await page.waitForTimeout(3000);

  // Check if modal opened
  const dialogCount = await page.getByRole('dialog').count();
  const modalCount = await page.locator('[role="dialog"], .modal, .MuiDialog-root').count();
  console.log(`Modals/dialogs found: ${dialogCount} (by role), ${modalCount} (by selector)`);

  console.log('\n--- CONSOLE LOGS ---');
  console.log(logs.join('\n') || 'No console logs.');
  
  console.log('\n--- NETWORK ERRORS ---');
  console.log(networkErrors.join('\n') || 'No network errors.');

  await browser.close();
})();
