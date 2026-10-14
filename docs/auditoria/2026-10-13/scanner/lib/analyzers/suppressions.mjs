const ESLINT_DISABLE = /\beslint-disable(?:-next-line|-line)?\b(.*)$/;
const TS_DIRECTIVE = /@ts-(ignore|expect-error|nocheck)\b(.*)$/;
const TODO_MARKER = /\b(TODO|FIXME|HACK|XXX)\b(?:\s*\(([^)]*)\))?\s*:?/;
const TICKET_PATTERN = /^(?:[A-Z][A-Z0-9]+-\d+|#\d+|https?:\/\/\S+)$/;
const MIN_JUSTIFICATION_LENGTH = 6;
const JSDOC_ANY = /@(?:param|type|returns?|typedef|property|prop)\s*\{[^}]*(?:\bany\b|\*)[^}]*\}/;

function lineEntries(record) {
  return record.text.split('\n').map((text, index) => ({ text, line: record.line + index }));
}

function eslintJustified(rest) {
  const reason = rest.split(/\s--\s|\s--$/)[1];
  return reason !== undefined && reason.trim().length > 0;
}

function tsJustified(rest) {
  const reason = rest.replace(/^[\s:\-–—]+/, '').trim();
  return reason.length >= MIN_JUSTIFICATION_LENGTH;
}

export function analyzeSuppressions(ctx) {
  const eslintDisables = [];
  const tsDirectives = [];
  const todos = [];
  const jsdocAny = [];
  for (const record of ctx.commentRecords) {
    for (const { text, line } of lineEntries(record)) {
      const eslint = ESLINT_DISABLE.exec(text);
      if (eslint) {
        eslintDisables.push({ line, text: text.trim(), justified: eslintJustified(eslint[1]) });
      }
      const ts = TS_DIRECTIVE.exec(text);
      if (ts) {
        tsDirectives.push({ line, directive: `@ts-${ts[1]}`, justified: tsJustified(ts[2]), text: text.trim() });
      }
      const todo = TODO_MARKER.exec(text);
      if (todo && !record.directive) {
        const reference = (todo[2] ?? '').trim();
        todos.push({ line, marker: todo[1], reference, hasTicket: TICKET_PATTERN.test(reference), text: text.trim() });
      }
    }
    if (!ctx.isTs && record.kind === 'jsdoc' && JSDOC_ANY.test(record.text)) {
      jsdocAny.push({ line: record.line, text: record.text.match(JSDOC_ANY)[0] });
    }
  }
  return { eslintDisables, tsDirectives, todos, jsdocAny };
}
