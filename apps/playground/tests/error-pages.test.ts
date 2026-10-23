import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import errorPage from '../app/error.tsx';
import globalErrorPage from '../app/global-error.tsx';
import notFoundPage from '../app/not-found.tsx';

const SECRET = 'segredo-que-nao-pode-vazar';
const DIGEST = 'digest-123';
const buildError = (): Error & { digest?: string } => Object.assign(new Error(SECRET), { digest: DIGEST });
const FORBIDDEN_IN_SCREEN = [/stack/u, /Error:/u, /\bat\s/u, new RegExp(SECRET, 'u')];

function expectNoLeak(html: string): void {
  for (const pattern of FORBIDDEN_IN_SCREEN) expect(html).not.toMatch(pattern);
}

describe('páginas de erro', () => {
  it('a 404 fala goianês e oferece o caminho de volta', () => {
    const html = renderToStaticMarkup(createElement(notFoundPage));
    expect(html).toContain('Cabôu o caminho, sô');
    expect(html).toContain('href="/"');
    expectNoLeak(html);
  });

  it('error.tsx mostra só o digest, tem o botão "tenta de novo" e liga o reset', () => {
    const reset = vi.fn();
    const error = buildError();
    const html = renderToStaticMarkup(createElement(errorPage, { error, reset }));
    expect(html).toMatch(/tenta de novo/iu);
    expect(html).toContain(DIGEST);
    expectNoLeak(html);
    const element = errorPage({ error, reset }) as ReactElement<{ onRetry: () => void }>;
    element.props.onRetry();
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('error.tsx sem digest não mostra código', () => {
    const html = renderToStaticMarkup(createElement(errorPage, { error: new Error(SECRET), reset: vi.fn() }));
    expect(html).not.toContain('Código');
    expectNoLeak(html);
  });

  it('global-error.tsx traz html e body próprios, botão e nenhum vazamento', () => {
    const html = renderToStaticMarkup(createElement(globalErrorPage, { error: buildError(), reset: vi.fn() }));
    expect(html).toMatch(/^<html[^>]*lang="pt-BR"/u);
    expect(html).toContain('<body');
    expect(html).toMatch(/tenta de novo/iu);
    expectNoLeak(html);
  });
});
