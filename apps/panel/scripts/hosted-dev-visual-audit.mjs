// Hosted DEV-only read-only visual audit. No customer logins or booking mutations.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = 'https://dev.salon-bw.pl';
const outDir = path.resolve(process.cwd(), 'hosted-dev-visual-artifacts');
const user = process.env.DEV_ACCESS_USER;
const password = process.env.DEV_ACCESS_PASSWORD;
const expectedSha = 'f39ec397062fec3acd81158ea6475e7864d807fb';
if (!user || !password) throw new Error('DEV Basic Auth credentials missing in staging environment');
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const summaries = [];
const routes = [
  ['home', '/'],
  ['catalog', '/services'],
  ['editorial', '/design-lab?variant=editorial'],
  ['cinematic', '/design-lab?variant=cinematic'],
  ['atelier', '/design-lab?variant=atelier'],
  ['hairdressing', '/services?offer=hairdressing'],
  ['care', '/services?offer=care'],
  ['extensions', '/services?offer=extensions'],
];
const devices = [
  ['mobile-390', 390, 844],
  ['tablet-768', 768, 1024],
  ['desktop-1440', 1440, 900],
];
let fatal = false;
try {
  const check = await browser.newContext({
    httpCredentials: { username: user, password, origin, send: 'always' },
    ignoreHTTPSErrors: false,
  });
  const response = await check.request.get(origin + '/__release.json', { timeout: 20000 });
  if (response.status() !== 200) throw new Error('Authenticated DEV release check HTTP ' + response.status());
  const meta = await response.json();
  if (meta.sha !== expectedSha || meta.environment !== 'development') {
    throw new Error('DEV release mismatch: wrong SHA/environment, audit aborted');
  }
  console.log('Verified expected DEV release SHA, environment=development');
  await check.close();

  for (const [device, width, height] of devices) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      isMobile: width === 390,
      hasTouch: width === 390,
      reducedMotion: 'reduce',
      httpCredentials: { username: user, password, origin, send: 'always' },
      ignoreHTTPSErrors: false,
      serviceWorkers: 'block'
    });
    for (const [label, urlPath] of routes) {
      const page = await context.newPage();
      let pageErrors = 0, consoleErrors = 0;
      page.on('pageerror', () => { pageErrors++; });
      page.on('console', msg => { if (msg.type() === 'error') consoleErrors++; });
      let status = 0, report = null;
      try {
        const response = await page.goto(origin + urlPath, { waitUntil: 'domcontentloaded', timeout: 35000 });
        status = response?.status() ?? 0;
        await page.waitForTimeout(1500);
        await page.evaluate(() => document.fonts.ready).catch(() => null);
        const metrics = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          const headings = Array.from(document.querySelectorAll('h1')).filter(x => x.getBoundingClientRect().width > 0);
          const main = document.querySelector('main');
          const buttons = Array.from(document.querySelectorAll('button'));
          return {
            title: document.title,
            h1: headings.map(x => (x.textContent || '').trim().slice(0,120)),
            mainPresent: !!main,
            horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: window.innerWidth,
            bodyHeight: document.documentElement.scrollHeight,
            images: imgs.length,
            missingImageAlt: imgs.filter(x => !x.hasAttribute('alt')).length,
            brokenLoadedImages: imgs.filter(x => x.complete && x.naturalWidth === 0).length,
            buttonsWithoutNames: buttons.filter(x => !(x.getAttribute('aria-label') || x.getAttribute('title') || x.textContent || '').trim()).length,
            language: document.documentElement.lang,
            modalCount: document.querySelectorAll('[role=dialog]').length
          };
        });
        const file = device + '-' + label + '.jpg';
        await page.screenshot({ path: path.join(outDir,file), type: 'jpeg', quality: 80, fullPage: true, animations: 'disabled', timeout: 40000 });
        report = { device, path: urlPath, status, ...metrics, pageErrors, consoleErrors, screenshot: file };
        if (status !== 200 || metrics.horizontalOverflow || metrics.brokenLoadedImages > 0 || pageErrors > 0) fatal = true;
        console.log('VISUAL ' + JSON.stringify({ device, path: urlPath, status, h1: metrics.h1, overflow: metrics.horizontalOverflow, pageErrors, consoleErrors }));
      } catch (e) {
        fatal = true;
        report = { device, path: urlPath, status, error: e instanceof Error ? e.name : 'unknown' };
        console.error('VISUAL FAILED ' + device + ' ' + urlPath + ' (' + report.error + ')');
      } finally {
        summaries.push(report);
        await page.close();
      }
    }

    if (width === 390 || width === 1440) {
      const page = await context.newPage();
      try {
        await page.goto(origin + '/', { waitUntil: 'domcontentloaded', timeout: 35000 });
        await page.locator('.split-hero button').first().click({ timeout: 12000 });
        await page.waitForTimeout(350);
        const modal = page.getByRole('dialog');
        const modalVisible = (await modal.count()) > 0 && await modal.first().isVisible();
        await page.screenshot({ path:path.join(outDir, device+'-booking-modal.jpg'), type:'jpeg', quality:85, fullPage:false, animations:'disabled' });
        summaries.push({ device, task:'anonymous-booking-modal', modalVisible, screenshot:device+'-booking-modal.jpg' });
        if (!modalVisible) fatal = true;
        await page.keyboard.press('Escape');
      } catch (e) {
        fatal = true;
        summaries.push({ device, task:'anonymous-booking-modal', error: e instanceof Error ? e.name : 'unknown' });
      } finally { await page.close(); }
      for (const lang of ['en', 'de']) {
        const p = await context.newPage();
        try {
          await p.goto(origin+'/services', {waitUntil:'domcontentloaded', timeout:35000});
          await p.evaluate(language => localStorage.setItem('lang',language),lang);
          await p.reload({waitUntil:'domcontentloaded',timeout:35000});
          await p.waitForFunction(l => document.documentElement.lang === l, lang, {timeout:10000});
          await p.waitForTimeout(700);
          const file = device+'-catalog-'+lang+'.jpg';
          await p.screenshot({path:path.join(outDir,file),type:'jpeg',quality:80,fullPage:true,animations:'disabled'});
          summaries.push({device,task:'locale',locale:lang,actualLang:await p.locator('html').getAttribute('lang'),screenshot:file});
        } catch(e) {
          fatal = true;
          summaries.push({device,task:'locale',locale:lang,error:e instanceof Error ? e.name : 'unknown'});
        } finally {await p.close();}
      }
    }
    await context.close();
  }
} finally {
  await writeFile(path.join(outDir,'audit-summary.json'), JSON.stringify({expectedSha,origin,observations:summaries},null,2));
  await browser.close();
}
if (fatal) process.exitCode = 1;
