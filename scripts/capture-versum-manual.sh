#!/bin/bash
# Skrypt do ręcznego wykonania screenshotów z Versum
# Uruchom: bash scripts/capture-versum-manual.sh
# Następnie zaloguj się ręcznie w otwartej przeglądarce

set -euo pipefail

cd apps/panel

echo "Tworzenie testu..."

cat > tests/e2e/versum-manual.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('capture versum customers - manual login', async ({ page }) => {
  const email = process.env.VERSUM_LOGIN_EMAIL || '<ustaw VERSUM_LOGIN_EMAIL>';
  const passwordHint = process.env.VERSUM_LOGIN_PASSWORD ? '***' : '<ustaw VERSUM_LOGIN_PASSWORD>';

  test.setTimeout(120000); // 2 minutes
  
  // Set viewport
  await page.setViewportSize({ width: 1366, height: 768 });
  
  // Go to login page
  console.log('Opening Versum login page...');
  await page.goto('https://panel.versum.com/salonblackandwhite/customers');
  
  // Wait for user to login manually
  console.log('========================================');
  console.log('ZALOGUJ SIĘ RĘCZNIE W PRZEGLĄDARCE');
  console.log(`Email: ${email}`);
  console.log(`Hasło: ${passwordHint}`);
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
echo "Email: ${VERSUM_LOGIN_EMAIL:-<ustaw VERSUM_LOGIN_EMAIL>}"
if [[ -n "${VERSUM_LOGIN_PASSWORD:-}" ]]; then
  echo "Hasło: ***"
else
  echo "Hasło: <ustaw VERSUM_LOGIN_PASSWORD>"
fi
echo ""

npx playwright test tests/e2e/versum-manual.spec.ts --headed --workers=1
