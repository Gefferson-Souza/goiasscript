'use strict';
const L = (...lines) => lines.join('\n');
const BT = '`';

module.exports = [
  // ---------- strings ----------
  { id: 'S01', grupo: 'string', titulo: 'aspas duplas escapadas contendo keyword', gs: String.raw`prosa("ele disse \"mais\" e saiu");`, esperado: 'ele disse "mais" e saiu', classe: 'controle' },
  { id: 'S02', grupo: 'string', titulo: 'aspas simples escapadas', gs: String.raw`prosa('it\'s mais de um');`, esperado: "it's mais de um", classe: 'controle' },
  { id: 'S03', grupo: 'string', titulo: 'apóstrofo dentro de string com aspas duplas', gs: `prosa("d'água mais fria");`, esperado: "d'água mais fria", classe: 'controle' },
  { id: 'S04', grupo: 'string', titulo: 'string com `$&` (padrão especial de String.replace)', gs: 'prosa("preço $& fim");', esperado: 'preço $& fim', sev: 'HIGH', classe: 'defeito', nota: 'a restauração usa replace(placeholder, original) com `original` como padrão de substituição' },
  { id: 'S05', grupo: 'string', titulo: 'string com `$$` (moeda: "US$$")', gs: 'prosa("custa US$$ 10");', esperado: 'custa US$$ 10', sev: 'HIGH', classe: 'defeito' },
  { id: 'S06', grupo: 'string', titulo: "string com `$'` (insere o resto do código!)", gs: L("prosa(\"a $' b\");", 'prosa("depois");'), esperado: "a $' b\ndepois", sev: 'HIGH', classe: 'defeito' },
  { id: 'S07', grupo: 'string', titulo: 'string com `$1` e `$<x>` (controle: não são especiais para padrão-string)', gs: 'prosa("custa $1 e $<x>");', esperado: 'custa $1 e $<x>', classe: 'controle' },
  { id: 'S08', grupo: 'string', titulo: 'literal "__STRING_1__" dentro de uma string (colisão com placeholder)', gs: L('prosa("__STRING_1__");', 'prosa("b");'), esperado: '__STRING_1__\nb', sev: 'LOW', classe: 'defeito' },
  { id: 'S09', grupo: 'string', titulo: 'identificador do usuário `__STRING_0__`', gs: L('uai __STRING_0__ é 5;', 'prosa("a", __STRING_0__);'), esperado: 'a 5', sev: 'LOW', classe: 'defeito' },
  { id: 'S10', grupo: 'string', titulo: 'continuação de linha dentro de string ("abc\\<LF>def")', gs: 'uai s é "abc\\\ndef"; uai k é "mais"; prosa(s, k);', esperado: 'abcdef mais', sev: 'LOW', classe: 'defeito', nota: '`.` do regex não casa `\\n`, então o par de aspas é perdido' },
  { id: 'S11', grupo: 'string', titulo: 'URL com // em string', gs: 'prosa("http://x.com/mais/de");', esperado: 'http://x.com/mais/de', classe: 'controle' },
  { id: 'S12', grupo: 'string', titulo: 'texto ".replace(" dentro de string gera aviso', gs: 'prosa("use .replace( pra trocar");', check: r => ({ ok: r.transpiled && r.run.ok && r.run.stdout === 'use .replace( pra trocar' && !r.warnings.some(w => w.includes('.replace')), detalhe: `avisos=${JSON.stringify(r.warnings)}` }), sev: 'LOW', classe: 'defeito', nota: 'esperado: nenhum aviso; o aviso sai sobre texto de string e ainda recomenda ".replace" (o próprio método proibido)' },
  { id: 'S13', grupo: 'string', titulo: 'string não terminada: erro deve ser reportado na tradução com linha', gs: L('uai a é 1;', 'prosa("abc);', 'prosa(a);'), check: r => ({ ok: !r.transpiled, detalhe: r.transpiled ? 'transpile=success (erro só aparece ao executar, sem linha do .gs): ' + (r.run && r.run.error) : '' }), sev: 'MEDIUM', classe: 'defeito' },

  // ---------- comentários que distorcem o pareamento de aspas ----------
  { id: 'C01', grupo: 'comentario', titulo: 'comentário // com keywords é preservado', gs: L('// vai de mais em menos', 'prosa("ok");'), check: r => ({ ok: r.transpiled && r.user.startsWith('// vai de mais em menos'), detalhe: `saída=${r.user && r.user.split('\n')[0]}` }), sev: 'LOW', classe: 'defeito', nota: 'comentário é reescrito ("Clica em" vira "Clica in")' },
  { id: 'C02', grupo: 'comentario', titulo: "apóstrofo solto em comentário // engole o código até o próximo '", gs: L("// não esqueça d'água", 'uai x é 5;', 'prosa(x mais 1);', "// outro comentário com ' aspas"), esperado: '6', sev: 'HIGH', classe: 'defeito', nota: 'comentários não são removidos/ignorados antes do pareamento de aspas' },
  { id: 'C03', grupo: 'comentario', titulo: 'aspa dupla ímpar em comentário /* */ dessincroniza strings', gs: L('/* ele disse: "oi */', 'uai x é 1;', 'prosa("fim", x);'), esperado: 'fim 1', sev: 'HIGH', classe: 'defeito' },
  { id: 'C04', grupo: 'comentario', titulo: 'polegadas em comentário: // 5" de altura', gs: L('// tela de 5" de altura', 'uai a é "x";', 'uai b é 1 mais 2;', 'prosa(a, b);'), esperado: 'x 3', sev: 'HIGH', classe: 'defeito' },
  { id: 'C05', grupo: 'comentario', titulo: 'comentário final de linha com URL e aspas balanceadas', gs: 'uai x é 1; // veja "http://a.b/c" mais\nprosa(x);', esperado: '1', classe: 'controle' },

  // ---------- template literals ----------
  { id: 'T01', grupo: 'template', titulo: 'template simples com interpolação', gs: 'uai nome é "Ana"; prosa(' + BT + 'Olá, ${nome}!' + BT + ');', esperado: 'Olá, Ana!', classe: 'controle' },
  { id: 'T02', grupo: 'template', titulo: 'texto em português dentro do template (é/mais/de/em)', gs: 'prosa(' + BT + 'isso é mais de um em muitos' + BT + ');', esperado: 'isso é mais de um em muitos', sev: 'HIGH', classe: 'defeito', nota: 'template literal não é protegido: o texto do usuário é traduzido como código' },
  { id: 'T03', grupo: 'template', titulo: 'keyword dentro de ${ } é traduzida (comportamento desejável)', gs: 'prosa(' + BT + 'soma: ${1 mais 2}' + BT + ');', esperado: 'soma: 3', classe: 'controle' },
  { id: 'T04', grupo: 'template', titulo: 'template com aspas internas e a palavra mais', gs: 'prosa(' + BT + 'ele disse "oi" e \'tchau\' mais uma vez' + BT + ');', esperado: 'ele disse "oi" e \'tchau\' mais uma vez', sev: 'HIGH', classe: 'defeito' },
  { id: 'T05', grupo: 'template', titulo: 'template aninhado', gs: 'prosa(' + BT + 'a ${' + BT + 'b ${1 mais 1}' + BT + '} de c' + BT + ');', esperado: 'a b 2 de c', sev: 'HIGH', classe: 'defeito' },
  { id: 'T06', grupo: 'template', titulo: 'template com texto ".length"', gs: 'prosa(' + BT + 'o .length da lista' + BT + ');', esperado: 'o .length da lista', sev: 'MEDIUM', classe: 'defeito' },
  { id: 'T07', grupo: 'template', titulo: "apóstrofo em template engole código até o próximo '", gs: L('prosa(' + BT + "d'água" + BT + ');', 'uai y é 2;', 'prosa(y mais 1);', "prosa('fim');"), esperado: "d'água\n3\nfim", sev: 'HIGH', classe: 'defeito' },
  { id: 'T08', grupo: 'template', titulo: 'template multilinha com `é` entre palavras', gs: 'prosa(' + BT + 'linha 1\nisso é a linha 2' + BT + ');', esperado: 'linha 1\nisso é a linha 2', sev: 'HIGH', classe: 'defeito' },

  // ---------- regex literals ----------
  { id: 'R01', grupo: 'regex', titulo: 'regex literal com `de|em`', gs: 'uai r é /de|em/g; prosa("de em".match(r).length);', esperado: '2', sev: 'MEDIUM', classe: 'defeito', nota: 'regex literal não é protegido' },
  { id: 'R02', grupo: 'regex', titulo: 'regex com aspa dupla: s.replace(/"/g, "") desalinha as strings seguintes', gs: L('uai limpo é "x".replace(/"/g, "");', 'uai y é "mais de" mais " em";', 'prosa(limpo, y);'), esperado: 'x mais de em', sev: 'HIGH', classe: 'defeito' },
  { id: 'R03', grupo: 'regex', titulo: 'função clássica de escape HTML (regex com aspa simples e dupla)', gs: L(
    'faz_trem escapa(s) {',
    '  faz_favor s.replace(/&/g, "&amp;").replace(/\'/g, "&#39;").replace(/"/g, "&quot;");',
    '}',
    'prosa(escapa(\'a "b" \' + "c\'d"));'), check: r => ({ ok: r.transpiled && r.run.ok && r.run.stdout === 'a &quot;b&quot; c&#39;d' && !r.user.includes('prosa(') && !r.user.includes('.replace('), detalhe: `stdout=${r.run && r.run.stdout} | residual na saída: prosa( ${r.user && r.user.includes('prosa(')} / .replace( ${r.user && r.user.includes('.replace(')}` }), sev: 'HIGH', classe: 'defeito', nota: 'passa no stdout por acaso: trecho ficou "protegido" como string e sem tradução' },
  { id: 'R04', grupo: 'regex', titulo: 'regex com classe de caracteres e \\b', gs: 'prosa("a-b".split(/-/).length);', esperado: '2', classe: 'controle' },
];
