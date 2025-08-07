import { test, expect } from '@playwright/test';

test('projector checkbox is selectable', async ({ page }) => {
  await page.setContent(`
    <label for="equipment-projector">
      <input id="equipment-projector" type="checkbox" name="equipment" value="projector">Projector
    </label>
  `);
  const checkbox = page.getByLabel('Projector');
  await checkbox.check();
  await expect(checkbox).toBeChecked();
});
