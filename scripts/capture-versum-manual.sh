#!/bin/bash
# Skrypt do ręcznego wykonania screenshotów z Versum
# Uruchom: bash scripts/capture-versum-manual.sh
# Następnie zaloguj się ręcznie w otwartej przeglądarce

cd apps/panel

echo "Tworzenie testu..."

cat > tests/e2e/versum-manual.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('capture versum customers - manual login', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  
  // Set viewport
  await page.setViewportSize({ width: 1366, height: 768 });
  
  // Go to login page
  console.log('Opening Versum login page...');
  await page.goto('https://panel.versum.com/salonblackandwhite/customers');
  
  // Wait for user to login manually
  console.log('========================================');
  console.log('ZALOGUJ SIĘ RĘCZNIE W PRZEGLĄDARCE');
  console.log('Email: REDACTED_EMAIL');
  console.log('Hasło: REDACTED_SECRET');
  console.log('========================================');
  console.log('Po zalogowaniu, naciśnij ENTER w terminalu...');
  
  // Wait for navigation to customers page
  await page.waitForURL('**/salonblackandwhite/customers**', { timeout: 120000 });
  console.log('Zalogowano! Wykonuję screenshoty...');
  
  // Screenshot 1: Customers list
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '../../../docs/Architektura/versum-customers-list-1366.png' });
  console.log('✅ Screenshot 1: versum-customers-list-1366.png');
  
  // Click on first customer
  const customerLinks = await page.locator('a[href*="/customers/"]:not([href*="/customers/new"])').all();
  if (customerLinks.length > 0) {
    await customerLinks[0].click();
    await page.waitForTimeout(3000);
    
    // Screenshot 2: Customer profile
    await page.screenshot({ path: '../../../docs/Architektura/versum-customer-profile-1366.png' });
    console.log('✅ Screenshot 2: versum-customer-profile-1366.png');
    
    // Navigate through tabs
    const tabs = ['dane osobowe', 'statystyki', 'historia', 'komentarze'];
    for (const tab of tabs) {
      const tabLink = await page.locator(`text=${tab}`).first();
      if (await tabLink.isVisible().catch(() => false)) {
        await tabLink.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `../../../docs/Architektura/versum-customer-${tab.replace(' ', '-')}-1366.png` });
        console.log(`✅ Screenshot: versum-customer-${tab.replace(' ', '-')}-1366.png`);
      }
    }
  }
  
  console.log('');
  console.log('========================================');
  console.log('GOTOWE! Screenshoty zapisane w:');
  console.log('docs/Architektura/');
  console.log('========================================');
});
EOF

echo ""
echo "========================================"
echo "URUCHAMIANIE TESTU W TRYBIE HEADED"
echo "========================================"
echo ""
echo "Zaloguj się ręcznie w otwartej przeglądarce:"
echo "Email: REDACTED_EMAIL"
echo "Hasło: REDACTED_SECRET"
echo ""

npx playwright test tests/e2e/versum-manual.spec.ts --headed --workers=1
