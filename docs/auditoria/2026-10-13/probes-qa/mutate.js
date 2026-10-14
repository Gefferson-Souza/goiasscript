// Harness de mutação artesanal (somente em cópia no scratchpad; nunca toca o repo).
// Uso: node mutate.js <dir-probes> <arquivo-alvo-relativo> [filtro-de-suites]
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROBES = process.argv[2];
const TARGET = process.argv[3] || 'src/compiler/simpleTranspiler.js';
const POOL = Number(process.env.POOL || 4);
const BASE = path.join(PROBES, 'mut', 'core');
const original = fs.readFileSync(path.join(BASE, TARGET), 'utf8');
const lines = original.split('\n');

function findBlock(startRe, endRe) {
  const start = lines.findIndex(l => startRe.test(l));
  if (start < 0) return null;
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (endRe.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { start, end };
}

const mutants = [];

// 1) cada entrada da tabela de mapeamento: troca o valor JS por um marcador
const table = findBlock(/const mappings = \[/, /^\s*\];\s*$/);
if (table) {
  for (let i = table.start + 1; i < table.end; i++) {
    const m = lines[i].match(/^(\s*)\['([^']+)',\s*'([^']+)'\],\s*$/);
    if (m) {
      mutants.push({
        id: `mapa:${m[2]}->${m[3]}@L${i + 1}`,
        kind: 'mapping',
        line: i,
        text: `${m[1]}['${m[2]}', '__MUT__'],`,
      });
    }
  }
}

// 2) cada substituição de método JS->goiano: remove a linha (vira no-op)
const conv = findBlock(/_convertJSMethodsToGoiano\(code\) \{/, /^\s*return result;\s*$/);
if (conv) {
  for (let i = conv.start + 1; i < conv.end; i++) {
    if (/^\s*result = result\.replace\(.*\);\s*$/.test(lines[i])) {
      mutants.push({
        id: `conv:L${i + 1}:${lines[i].trim().slice(0, 60)}`,
        kind: 'convert',
        line: i,
        text: `    // removed`,
      });
    }
  }
}

// 3) mutantes manuais de ramos/validações
const manual = [
  ['ramo-ocê: $1this$2', /'\$1this\$2'/, "'$1THIS$2'"],
  ["ramo-é: ' = '", /\.replace\(\/\\s\+é\\s\+\/g, ' = '\)/, ".replace(/\\s+é\\s+/g, ' == ')"],
  ['ramo-acento/underscore: troca jsWord', /`\$1\$\{jsWord\}\$2`/, '`$1__MUT__$2`'],
  ['ramo-boundary: troca jsWord', /result\.replace\(boundaryRegex, jsWord\)/, "result.replace(boundaryRegex, '__MUT__')"],
  ['restaura strings: placeholder vira vazio', /result\.replace\(placeholder, original\)/, "result.replace(placeholder, '')"],
  ['remove runtime prefixado', /jsCode = goianoRuntime \+ '\\n\\n' \+ jsCode;/, 'jsCode = jsCode;'],
  ['validate: ignora {{{', /trimmed\.includes\('\{\{\{'\) \|\| trimmed\.includes\('\}\}\}'\)/, 'false'],
  ["validate: ignora 'uai ' incompleto", /trimmed\.startsWith\('uai '\) &&/, "trimmed.startsWith('__never__') &&"],
  ['checkForbidden: nunca avisa', /if \(code\.includes\(method\)\) \{/, 'if (false) {'],
  ['tokens: sempre vazio', /const tokens = this\._generateTokens\(code\);/, 'const tokens = [];'],
  ['removeTypeAnnotations: no-op', /return code\.replace\(\/\(uai\|trem\)/, 'return code; //'],
];
for (const [id, re, repl] of manual) {
  const idx = lines.findIndex(l => re.test(l));
  if (idx >= 0) {
    mutants.push({ id: `manual:${id}@L${idx + 1}`, kind: 'manual', line: idx, text: lines[idx].replace(re, repl) });
  } else {
    mutants.push({ id: `manual:${id}`, kind: 'manual-notfound', line: -1, text: '' });
  }
}

function runJest(cwd) {
  return new Promise(resolve => {
    const child = spawn('./node_modules/.bin/jest', ['--coverage=false', '--bail', '--silent', '--testTimeout=5000'], {
      cwd,
      env: { ...process.env, CI: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', d => (out += d));
    child.stderr.on('data', d => (out += d));
    const timer = setTimeout(() => child.kill('SIGKILL'), 120000);
    child.on('close', code => {
      clearTimeout(timer);
      resolve({ code, out });
    });
  });
}

// pool de cópias de trabalho
async function main() {
  const workers = [];
  for (let w = 0; w < POOL; w++) {
    const dir = path.join(PROBES, 'mut', `w${w}`);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    for (const item of ['src', 'tests', 'bin', 'jest.config.js', '.babelrc', 'package.json']) {
      fs.cpSync(path.join(BASE, item), path.join(dir, item), { recursive: true });
    }
    fs.symlinkSync(path.join(BASE, 'node_modules'), path.join(dir, 'node_modules'));
    workers.push(dir);
  }

  const results = [];
  let next = 0;
  async function work(dir) {
    while (true) {
      const i = next++;
      if (i >= mutants.length) return;
      const mt = mutants[i];
      if (mt.kind === 'manual-notfound') {
        results.push({ ...mt, status: 'NAO-ENCONTRADO' });
        continue;
      }
      const mutated = lines.slice();
      mutated[mt.line] = mt.text;
      fs.writeFileSync(path.join(dir, TARGET), mutated.join('\n'));
      const r = await runJest(dir);
      // código 0 = todos os testes passaram = mutante SOBREVIVEU
      const status = r.code === 0 ? 'SOBREVIVEU' : 'MORTO';
      let failedTests = [];
      if (status === 'MORTO') {
        failedTests = (r.out.match(/●[^\n]+/g) || []).slice(0, 2);
      }
      results.push({ id: mt.id, kind: mt.kind, status, failedTests });
      fs.writeFileSync(path.join(dir, TARGET), original);
    }
  }
  await Promise.all(workers.map(work));
  results.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(path.join(PROBES, 'mutation-results.json'), JSON.stringify(results, null, 2));

  const byKind = {};
  for (const r of results) {
    byKind[r.kind] = byKind[r.kind] || { total: 0, mortos: 0, sobreviveu: 0 };
    byKind[r.kind].total++;
    if (r.status === 'MORTO') byKind[r.kind].mortos++;
    if (r.status === 'SOBREVIVEU') byKind[r.kind].sobreviveu++;
  }
  console.log(JSON.stringify(byKind, null, 2));
  const total = results.filter(r => r.status !== 'NAO-ENCONTRADO');
  const killed = total.filter(r => r.status === 'MORTO').length;
  console.log(`TOTAL mutantes=${total.length} mortos=${killed} sobreviveram=${total.length - killed} score=${((killed / total.length) * 100).toFixed(1)}%`);
}

main();
