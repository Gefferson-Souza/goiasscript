import { childNodes } from './ast-utils.mjs';
import { extractEmbeddedSources, toEmbeddedContext } from './embedded.mjs';
import { collectDeclared } from './analyzers/identifiers.mjs';
import { normalizeName } from './lexicon.mjs';
import { OBJECT_KEY_SURFACE_FILES, isSurfaceFile } from './surface-config.mjs';

const NAME_LIKE_STRING = /^\.?[\p{L}_][\p{L}\p{N}_]*$/u;
const MIN_SURFACE_NAME = 3;
const MIN_TABLE_ENTRIES = 5;

function propertyKeyName(property) {
  if (property.computed) return null;
  if (property.key.type === 'Identifier') return property.key.name;
  return property.key.type === 'StringLiteral' ? property.key.value : null;
}

function collectStringTableKeys(node, sink) {
  if (node.type !== 'ObjectExpression' || node.properties.length < MIN_TABLE_ENTRIES) return;
  const allStringValues = node.properties.every(
    (property) => property.type === 'ObjectProperty' && property.value.type === 'StringLiteral',
  );
  if (!allStringValues) return;
  for (const property of node.properties) {
    const name = propertyKeyName(property);
    if (name && NAME_LIKE_STRING.test(name)) sink.add(name);
  }
}

function collectStrings(root, nameSink, tableKeySink) {
  const visit = (node) => {
    if (tableKeySink) collectStringTableKeys(node, tableKeySink);
    if (node.type === 'StringLiteral' && NAME_LIKE_STRING.test(node.value) && node.value.length >= MIN_SURFACE_NAME) {
      nameSink.add(node.value.replace(/^\./, ''));
    }
    for (const child of childNodes(node)) visit(child);
  };
  visit(root);
}

// verbatim: qualquer string parecida com identificador nos arquivos de superfície (base do "espelho").
// apiNames: nomes que a linguagem expõe de fato (runtime embutido + tabelas de arquivos permitidos).
export function buildSurfaceLexicon(contexts) {
  const verbatim = new Set();
  const apiNames = new Set();
  for (const ctx of contexts) {
    const { rel } = ctx.file;
    if (!isSurfaceFile(rel)) continue;
    collectStrings(ctx.ast.program, verbatim, OBJECT_KEY_SURFACE_FILES.has(rel) ? apiNames : null);
    for (const embedded of extractEmbeddedSources(ctx)) {
      const embeddedCtx = toEmbeddedContext(ctx, embedded);
      for (const entry of collectDeclared(embeddedCtx)) {
        if (entry.position !== 'api') continue;
        verbatim.add(entry.name);
        apiNames.add(entry.name);
      }
    }
  }
  const normalized = new Set([...verbatim].map(normalizeName));
  return { verbatim, apiNames, normalized };
}
