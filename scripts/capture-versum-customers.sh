#!/bin/bash
# Skrypt do wykonania screenshotów z Versum
# Uruchom: bash scripts/capture-versum-customers.sh

cd apps/panel

cat > /tmp/versum-capture.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('capture versum customers', async ({ page }) => {
  // Set viewport
  await page.setViewportSize({ width: 1366, height: 768 });
  
  // Go to login page
  await page.goto('https://panel.versum.com/salonblackandwhite/customers');
  
  // Fill login form
  await page.fill('input[type="text"], input[name="username"]', 'gniewko@bodora.pl');
  await page.fill('input[type="password"]', 'wywpib-daQko9-syhker');
  await page.click('button[type="submit"]');
  
  // Wait for customers list to load
  await page.waitForTimeout(10000);
  
  // Screenshot 1: Customers list
  await page.screenshot({ path: '../../docs/Architektura/versum-customers-list-1366.png' });
  
  // Click on first customer
  const customerLink = await page.locator('a[href*="/customers/"]').first();
  if (await customerLink.isVisible()) {
    await customerLink.click();
    await page.waitForTimeout(5000);
    
    // Screenshot 2: Customer profile
    await page.screenshot({ path: '../../docs/Architektura/versum-customer-profile-1366.png' });
  }
  
  console.log('Screenshots saved!');
});
EOF

npx playwright test /tmp/versum-capture.spec.ts --headed
