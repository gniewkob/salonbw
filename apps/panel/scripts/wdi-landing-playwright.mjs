#!/usr/bin/env node
// Browser regression against the actual Next.js design lab using its isolated CI catalog.
// Intentionally no hosted URLs, credentials or production traffic.
import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const origin = 'http://127.0.0.1:3000';
const output = path.join(process.cwd(), 'wdi-artifacts');
const browser = await chromium.launch({ headless: true });
try {
  await mkdir(output, { recursive: true });
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      const response = await page.goto(origin + '/design-lab?variant=atelier', {
        waitUntil: 'domcontentloaded', timeout: 45000,
      });
      if (response?.status() !== 200) throw new Error('Unexpected Atelier HTTP status: ' + response?.status());
      await expect(page.locator('[data-cy="design-atelier"] h1')).toBeVisible();
      const bar = await page.locator('[data-cy="design-studio-toolbar"]').boundingBox();
      const hero = await page.locator('[data-cy="design-atelier"] h1').boundingBox();
      if (!bar || !hero) throw new Error('Missing visible toolbar or hero');
      if (width === 390 && (bar.height > 125 || hero.y >= 740)) {
        throw new Error('Mobile design is buried below comparison controls: toolbar=' + bar.height + ' hero_y=' + hero.y);
      }
      await expect(page.locator('#atelier-story-title')).toBeAttached();
      await expect(page.locator('[data-cy="design-offer-1"]')).toHaveAttribute('href','/services?offer=care');
      await page.screenshot({ path: path.join(output,'atelier-' + width + '.png'), fullPage: true });
      await page.getByRole('button', { name: /Umów wizytę/ }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      if (pageErrors.length) throw new Error('Browser JS errors: ' + pageErrors.join(' | ').slice(0,600));
      console.log('PASS Atelier ' + width + ': real SSR + visible hero + booking + catalog + screenshot');
    } finally {
      await context.close();
    }
  }

  // The Art of Hair: actual first-party photos, user task and gallery interactions.
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const response = await page.goto(origin + '/design-lab?variant=hairwork', {
        waitUntil: 'domcontentloaded', timeout: 45000,
      });
      if (response?.status() !== 200) throw new Error('Unexpected Hairwork HTTP status');
      await expect(page.locator('[data-cy="design-hairwork"] h1')).toBeVisible();
      const toolbar = await page.locator('[data-cy="design-studio-toolbar"]').boundingBox();
      const heading = await page.locator('[data-cy="design-hairwork"] h1').boundingBox();
      if (!toolbar || !heading || (width === 390 && (toolbar.height > 125 || heading.y >= 740))) {
        throw new Error('Hairwork hero is not visible near the first mobile viewport');
      }
      await expect(page.locator('[data-cy="hairwork-photo"]')).toHaveCount(6);
      const photos = page.locator('[data-cy="design-hairwork"] img');
      await expect(photos).toHaveCount(7);
      for (let index = 0; index < 7; index++) {
        const photo = photos.nth(index);
        await photo.scrollIntoViewIfNeeded();
        await expect.poll(() => photo.evaluate((image) => image.naturalWidth), {
          timeout: 15000,
        }).toBeGreaterThan(0);
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      if (overflow > 1) throw new Error('Hairwork horizontal overflow: ' + overflow);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: path.join(output, 'hairwork-' + width + '.png'),
        fullPage: true,
      });
      await page.locator('[data-cy="hairwork-photo"]').first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await page.getByRole('button', { name: /Umów wizytę/ }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.locator('[data-cy="design-offer-1"]')).toHaveAttribute(
        'href', '/services?offer=care',
      );
      if (errors.length) throw new Error('Hairwork browser JS errors: ' + errors.join(' | '));
      console.log('PASS Hairwork ' + width + ': seven actual photos + gallery + booking + catalog');
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
