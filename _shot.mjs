import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const out = process.argv[2] || 'shot.png';
const width = parseInt(process.argv[3] || '1440', 10);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-prefers-reduced-motion=reduce'],
});
const page = await browser.newPage();
await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0', timeout: 60000 });

// Reveal everything: force the reveal-on-scroll elements visible and scroll the
// problem section into view so nothing is opacity:0.
await page.evaluate(() => {
  document.querySelectorAll('.sc-anim').forEach((el) => el.classList.add('sc-anim-visible'));
  const p = document.querySelector('#problem');
  if (p) p.scrollIntoView({ block: 'center' });
});
await new Promise((r) => setTimeout(r, 1200));

const el = await page.$('.section-band--problem');
await el.screenshot({ path: out });
console.log('captured', out, 'at width', width);
await browser.close();
