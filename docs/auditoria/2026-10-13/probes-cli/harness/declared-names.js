'use strict';
// Lista os identificadores DECLARADOS (classes, métodos, funções, variáveis, parâmetros, propriedades de this/objeto)
// por arquivo, para classificar idioma manualmente. Sem dicionário: só extrai e deduplica.
const fs = require('fs');
const path = require('path');
const acorn = require(path.join(process.env.REPO, 'node_modules/.pnpm/acorn@8.16.0/node_modules/acorn'));
const walk = require(path.join(process.env.REPO, 'node_modules/.pnpm/acorn-walk@8.3.2/node_modules/acorn-walk'));

const collectPattern = (node, out) => {
  if (!node) return;
  switch (node.type) {
    case 'Identifier': out.add(node.name); break;
    case 'ObjectPattern': node.properties.forEach(p => collectPattern(p.type === 'RestElement' ? p.argument : p.value, out)); break;
    case 'ArrayPattern': node.elements.forEach(e => collectPattern(e, out)); break;
    case 'AssignmentPattern': collectPattern(node.left, out); break;
    case 'RestElement': collectPattern(node.argument, out); break;
    default: break;
  }
};

for (const file of process.argv.slice(2)) {
  const src = fs.readFileSync(file, 'utf8');
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true });
  const buckets = { classes: new Set(), methods: new Set(), functions: new Set(), variables: new Set(), params: new Set(), props: new Set() };

  walk.full(ast, node => {
    if (node.type === 'ClassDeclaration' && node.id) buckets.classes.add(node.id.name);
    if (node.type === 'MethodDefinition') buckets.methods.add(node.key.name || node.key.value);
    if (node.type === 'FunctionDeclaration' && node.id) buckets.functions.add(node.id.name);
    if (node.type === 'VariableDeclarator') collectPattern(node.id, buckets.variables);
    if (/Function/.test(node.type)) (node.params || []).forEach(p => collectPattern(p, buckets.params));
    if (node.type === 'CatchClause' && node.param) collectPattern(node.param, buckets.params);
    if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && node.left.object.type === 'ThisExpression') {
      buckets.props.add(node.left.property.name || node.left.property.value);
    }
    if (node.type === 'Property' && node.key.type === 'Identifier' && !node.computed) buckets.props.add(node.key.name);
  });

  console.log(`\n=== ${path.relative(process.env.CORE, file)}`);
  for (const [kind, set] of Object.entries(buckets)) {
    console.log(`${kind.padEnd(9)} (${set.size}): ${[...set].sort().join(', ')}`);
  }
}
