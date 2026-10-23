import type { MarkdownContent } from './markdown-content.types.ts';

const MARKDOWN_SPECIAL = /[\\`*_{}[\]()#+\-.!|<>~&]/gu;
const BACKTICK = /`/gu;

export const escapeMarkdown = (text: string): string => text.replaceAll(MARKDOWN_SPECIAL, '\\$&');
export const inlineCode = (code: string): string => `\`${code.replaceAll(BACKTICK, '')}\``;
export const untrusted = (value: string): MarkdownContent => ({ value, isTrusted: false, supportHtml: false });

export function lessonLink(url: string): string {
  return `[Dá uma olhada na lição](${encodeURI(url)})`;
}
