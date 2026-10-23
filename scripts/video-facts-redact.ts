import type { Redaction, VideoFacts } from './video-facts.types.ts';

function redactText(text: string, redactions: readonly Redaction[]): string {
  const ordered = [...redactions].filter((entry) => entry.value !== '').sort((a, b) => b.value.length - a.value.length);
  return ordered.reduce((acc, entry) => acc.split(entry.value).join(entry.replacement), text);
}

function redactNode(node: unknown, redactions: readonly Redaction[]): unknown {
  if (typeof node === 'string') return redactText(node, redactions);
  if (Array.isArray(node)) return node.map((item) => redactNode(item, redactions));
  if (node !== null && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, redactNode(value, redactions)]));
  }
  return node;
}

export function redactVideoFacts(facts: VideoFacts, redactions: readonly Redaction[]): VideoFacts {
  return redactNode(facts, redactions) as VideoFacts;
}
