import { describe, expect, it } from 'vitest';
import { isSafeLessonHref } from '../../lib/cartilha/markdown-urls.ts';

describe('links do Markdown das lições', () => {
  it.each(['https://goiasscript.dev/docs', '/cartilha/licao-02', '/glossario#prosa'])('aceita %s', (href) => {
    expect(isSafeLessonHref(href)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    ' JavaScript:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html,<b>x</b>',
    'http://exemplo.org',
    '//exemplo.org/x',
    '/\\exemplo.org',
    'vbscript:x',
    'cartilha/licao-01',
    '',
    'https://',
  ])('recusa %j', (href) => {
    expect(isSafeLessonHref(href)).toBe(false);
  });
});
