import { test, expect } from '@playwright/test';

test('capture versum customers', async ({ page }) => {
  // Increase timeout
  test.setTimeout(60000);
  
  // Set viewport
  await page.setViewportSize({ width: 1366, height: 768 });
  
  // Go to login page and wait for it to load
  console.log('Navigating to Versum...');
  await page.goto('https://panel.versum.com/salonblackandwhite/customers', { waitUntil: 'networkidle' });
  
  // Wait for login form - look for the visible text input (not hidden ones)
  console.log('Waiting for login form...');
  await page.waitForSelector('input:not([type="hidden"])', { timeout: 10000 });
  
  // Take screenshot of login page
  await page.screenshot({ path: '../../../docs/Architektura/versum-login-page.png' });
  console.log('Screenshot 1 saved: versum-login-page.png');
  
  // Fill email - use placeholder text to find the right input
  await page.getByPlaceholder('Nazwa użytkownika / email').fill('REDACTED_EMAIL');
  console.log('Email filled');
  
  // Fill password
  await page.getByPlaceholder('').nth(1).fill('REDACTED_SECRET');
  console.log('Password filled');
  
  // Click login button
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
  console.log('Login clicked');
  
  // Wait for navigation after login
  console.log('Waiting for customers page...');
  await page.waitForTimeout(15000);
  
  // Screenshot 2: Customers list
  await page.screenshot({ path: '../../../docs/Architektura/versum-customers-list-1366.png' });
  console.log('Screenshot 2 saved: versum-customers-list-1366.png');
  
  // Try to find and click on first customer
  const customerLinks = await page.locator('a[href*="/customers/"]:not([href*="/customers/new"])').all();
  console.log(`Found ${customerLinks.length} customer links`);
  
  if (customerLinks.length > 0) {
    console.log('Clicking on first customer...');
    await customerLinks[0].click();
    await page.waitForTimeout(5000);
    
    // Screenshot 3: Customer profile
    await page.screenshot({ path: '../../../docs/Architektura/versum-customer-profile-1366.png' });
    console.log('Screenshot 3 saved: versum-customer-profile-1366.png');
  }
  
  console.log('Done! Check docs/Architektura/ for screenshots');
});
