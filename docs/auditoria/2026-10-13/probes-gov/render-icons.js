'use strict';
const fs = require('fs');
const path = require('path');
const pw = require('<repo>/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const icons = '<repo>/vscode-extension/icons';
const out = path.join(__dirname, 'icons-render');
const exe = '<home>/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';

const big = `<html><body style="margin:0;display:flex">
  <div style="background:#fff;padding:12px;width:260px;height:276px"><img src="file://${icons}/goiasscript-file-light.svg" width="256" height="256"></div>
  <div style="background:#1e1e1e;padding:12px;width:260px;height:276px"><img src="file://${icons}/goiasscript-file-dark.svg" width="256" height="256"></div>
</body></html>`;
const small = `<html><body style="margin:0;display:flex">
  <div style="background:#fff;padding:4px"><img src="file://${icons}/goiasscript-file-light.svg" width="16" height="16"></div>
  <div style="background:#1e1e1e;padding:4px"><img src="file://${icons}/goiasscript-file-dark.svg" width="16" height="16"></div>
  <div style="background:#fff;padding:4px"><img src="file://${icons}/goiasscript-file-dark.svg" width="16" height="16"></div>
  <div style="background:#1e1e1e;padding:4px"><img src="file://${icons}/goiasscript-file-light.svg" width="16" height="16"></div>
</body></html>`;
fs.writeFileSync(path.join(out, 'big.html'), big);
fs.writeFileSync(path.join(out, 'small.html'), small);

(async () => {
  const browser = await pw.chromium.launch({ executablePath: exe });
  const p1 = await browser.newPage({ viewport: { width: 560, height: 300 }, deviceScaleFactor: 1 });
  await p1.goto('file://' + path.join(out, 'big.html'), { waitUntil: 'load' });
  await p1.screenshot({ path: path.join(out, 'chromium-256.png') });
  const p2 = await browser.newPage({ viewport: { width: 96, height: 24 }, deviceScaleFactor: 1 });
  await p2.goto('file://' + path.join(out, 'small.html'), { waitUntil: 'load' });
  await p2.screenshot({ path: path.join(out, 'chromium-16.png') });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
