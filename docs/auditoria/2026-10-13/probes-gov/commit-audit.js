'use strict';
const { execFileSync } = require('child_process');

const repo = '<repo>';
const SEP = '\u001f';
const END = '\u001e';
const raw = execFileSync(
  'git',
  ['-C', repo, 'log', '--all', `--format=%h${SEP}%ad${SEP}%an${SEP}%P${SEP}%s${SEP}%b${END}`, '--date=short'],
  { maxBuffer: 1 << 26 },
).toString('utf8');

const commits = raw
  .split(END)
  .map(s => s.replace(/^\n/, ''))
  .filter(Boolean)
  .map(chunk => {
    const [hash, date, author, parents, subject, body] = chunk.split(SEP);
    return { hash, date, author, merge: (parents || '').trim().split(/\s+/).filter(Boolean).length > 1, subject, body: (body || '').trim() };
  });

const TYPES = 'feat|fix|refactor|docs|test|chore|perf|ci|style|build|revert';
const conventional = new RegExp(`^(${TYPES})(\\(([^)]+)\\))?(!)?: (\\S.*)$`);
const PT = /\b(de|do|da|dos|das|para|com|que|uma|não|ao|por|nas|nos|adiciona|adicionar|corrige|atualiza|remove|arquiva|migra|torna|limpa|simplifica|implementa|resolve|lança|deixa|usado|classes|erros|testes|módulos|exemplos|documentação|instalação|melhorias|suporte|utilitários)\b/i;
const EN = /\b(add|adds|added|update|updates|remove|removes|implement|refactor|fix|fixes|improve|create|with|and|the|for|to|of|all|files|code|structure|redundant|comprehensive|complete|correct)\b/i;

function classifyLang(text) {
  const pt = (text.match(new RegExp(PT.source, 'gi')) || []).length;
  const en = (text.match(new RegExp(EN.source, 'gi')) || []).length;
  if (pt === 0 && en === 0) return 'indef';
  return pt >= en ? 'pt' : 'en';
}

const VAGUE_DESCRIPTION = /^(update|updates|ajustes?|wip|fix|fixes|changes?|stuff|misc)$/i;
const GITHUB_UI_DEFAULT = /^(Update|Create|Delete|Rename) [\w./-]+$|^Add files via upload$|^Initial commit$/;

function analyze(list, label) {
  const nonMerge = list.filter(c => !c.merge);
  const rows = nonMerge.map(c => {
    const m = c.subject.match(conventional);
    const description = m ? m[5] : c.subject;
    return {
      ...c,
      isConventional: !!m,
      type: m ? m[1] : null,
      scope: m ? m[3] || null : null,
      lowerStart: m ? /^[a-zà-ú]/.test(description) : false,
      lang: classifyLang(description),
      long: c.subject.length > 72,
      vague: GITHUB_UI_DEFAULT.test(c.subject) || VAGUE_DESCRIPTION.test(description) || (!m && !/[\p{L}]{4,}\s+[\p{L}]{3,}/u.test(c.subject)),
      hasBody: c.body.length > 0,
      endsWithPeriod: /\.$/.test(c.subject),
    };
  });
  const n = rows.length;
  const pct = x => `${x} (${((100 * x) / n).toFixed(0)}%)`;
  console.log(`\n== ${label}: ${list.length} commits (${list.length - n} merges) -> ${n} não-merge analisados`);
  console.log(`  formato <type>[(scope)]: descrição : ${pct(rows.filter(r => r.isConventional).length)}`);
  console.log(`  com scope                          : ${pct(rows.filter(r => r.scope).length)}  scopes: ${[...new Set(rows.filter(r => r.scope).map(r => r.scope))].join(', ') || '-'}`);
  const convCount = rows.filter(r => r.isConventional).length;
  console.log(`  descrição em minúscula (entre as conformes): ${rows.filter(r => r.isConventional && r.lowerStart).length}/${convCount}`);
  console.log(`  idioma pt / en / indef              : ${rows.filter(r => r.lang === 'pt').length} / ${rows.filter(r => r.lang === 'en').length} / ${rows.filter(r => r.lang === 'indef').length}`);
  console.log(`  assunto > 72 caracteres             : ${pct(rows.filter(r => r.long).length)}`);
  console.log(`  assunto termina com ponto           : ${pct(rows.filter(r => r.endsWithPeriod).length)}`);
  console.log(`  mensagens vagas / padrão da UI do GitHub : ${pct(rows.filter(r => r.vague).length)}  ${rows.filter(r => r.vague).map(r => r.hash).join(' ')}`);
  console.log(`  com corpo                           : ${pct(rows.filter(r => r.hasBody).length)}`);
  console.log(`  trailer Co-Authored-By/Claude-Session: ${rows.filter(r => /Co-Authored-By|Claude-Session/i.test(r.body)).length}`);
  return rows;
}

const byDate = (a, b) => (a.date < b.date ? 1 : -1);
const all = commits.sort(byDate);
const last60 = all.slice(0, 60);
const sinceSlim = all.filter(c => c.date >= '2026-05-03');
const preSlim = all.filter(c => c.date < '2026-05-03');

const rowsAll = analyze(all, 'TODO o histórico (todas as refs)');
analyze(last60, 'Últimos 60 commits (por data)');
analyze(sinceSlim, 'Desde o relançamento (>= 2026-05-03)');
analyze(preSlim, 'Antes do relançamento (< 2026-05-03)');

console.log('\n--- não conformes desde o relançamento (>= 2026-05-03) ---');
for (const r of rowsAll.filter(r => r.date >= '2026-05-03' && (!r.isConventional || r.long))) console.log(`  ${r.hash} ${r.date} ${r.subject.slice(0, 130)}${r.subject.length > 130 ? '…' : ''}  [conv=${r.isConventional} len=${r.subject.length}]`);
console.log('\n--- não conformes antes do relançamento ---');
for (const r of rowsAll.filter(r => r.date < '2026-05-03' && !r.isConventional)) console.log(`  ${r.hash} ${r.date} ${r.subject.slice(0, 110)}`);
console.log('\n--- autoria (nomes distintos) ---');
const authors = {};
for (const c of commits) authors[c.author] = (authors[c.author] || 0) + 1;
console.log(JSON.stringify(authors));
