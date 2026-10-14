'use strict';
const L = (...lines) => lines.join('\n');

module.exports = [
  // ---------- keyword como substring de identificador (fronteira de palavra) ----------
  { id: 'A01', grupo: 'identificador', titulo: 'prosaico (prefixo de keyword)', gs: 'uai prosaico é 1; prosa(prosaico);', esperado: '1', classe: 'controle' },
  { id: 'A02', grupo: 'identificador', titulo: 'maisum', gs: 'uai maisum é 2; prosa(maisum);', esperado: '2', classe: 'controle' },
  { id: 'A03', grupo: 'identificador', titulo: 'uaizinho', gs: 'uai uaizinho é 3; prosa(uaizinho);', esperado: '3', classe: 'controle' },
  { id: 'A04', grupo: 'identificador', titulo: 'trem2', gs: 'uai trem2 é 4; prosa(trem2);', esperado: '4', classe: 'controle' },
  { id: 'A05', grupo: 'identificador', titulo: 'emprego', gs: 'uai emprego é "dev"; prosa(emprego);', esperado: 'dev', classe: 'controle' },
  { id: 'A06', grupo: 'identificador', titulo: 'desde', gs: 'uai desde é 2020; prosa(desde);', esperado: '2020', classe: 'controle' },
  { id: 'A07', grupo: 'identificador', titulo: 'mais_um (underscore)', gs: 'uai mais_um é 7; prosa(mais_um);', esperado: '7', classe: 'controle' },
  { id: 'A08', grupo: 'identificador', titulo: 'identificadores acentuados sem keyword', gs: 'uai número é 3; uai açúcar é 4; prosa(número mais açúcar);', esperado: '7', classe: 'controle' },

  // ---------- keywords reservadas globalmente, mesmo sendo palavras comuns do português ----------
  { id: 'A09', grupo: 'identificador', titulo: 'variável chamada `de` (funciona por acidente: `of` é identificador válido em JS)', gs: 'uai de é 5; prosa(de);', esperado: '5', classe: 'controle', nota: '`de`/`em` são reservadas em qualquer posição; `de`->`of` sobrevive, `em`->`in` não' },
  { id: 'A10', grupo: 'identificador', titulo: 'parâmetro chamado `em`', gs: 'faz_trem f(em) { faz_favor em mais 1; } prosa(f(1));', esperado: '2', sev: 'MEDIUM', classe: 'limite-de-design' },
  { id: 'A11', grupo: 'identificador', titulo: 'variável chamada `vezes` (palavra comum)', gs: 'uai vezes é 3; prosa(vezes);', esperado: '3', sev: 'MEDIUM', classe: 'limite-de-design', nota: 'vezes/mais/menos/nada/diferente/certeza/promessa são palavras do dia a dia' },
  { id: 'A12', grupo: 'identificador', titulo: 'chaves de objeto `mais`/`menos`', gs: 'uai total é { mais: 1, menos: 2 }; prosa(total.mais, total.menos);', esperado: '1 2', sev: 'MEDIUM', classe: 'defeito' },
  { id: 'A13', grupo: 'identificador', titulo: 'chaves de JSON externo `de`/`em`/`nada` via ponto', gs: String.raw`uai o é JSON.parse('{"de":"SP","em":"RJ","nada":"x"}'); prosa(o.de, o.em, o.nada);`, esperado: 'SP RJ x', sev: 'HIGH', classe: 'defeito', nota: 'APIs em português usam {"de","para"}; a string é protegida mas o acesso `.de` é reescrito para `.of`' },
  { id: 'A14', grupo: 'identificador', titulo: '\\b ASCII: `nadação` vira `nullção` e vaza para os dados', gs: 'uai o é { nadação: 1 }; prosa(Object.keys(o)[0]);', esperado: 'nadação', sev: 'MEDIUM', classe: 'defeito', nota: '\\b do JS (sem flag u) trata letra acentuada como não-palavra' },
  { id: 'A15', grupo: 'identificador', titulo: '`$mais` (dólar é fronteira de palavra)', gs: 'uai $mais é 7; prosa($mais);', esperado: '7', sev: 'LOW', classe: 'defeito' },
  { id: 'A16', grupo: 'identificador', titulo: 'método do usuário chamado `prosa`', gs: 'uai o é { prosa() { faz_favor 1; } }; prosa(o.prosa());', esperado: '1', sev: 'LOW', classe: 'limite-de-design' },

  // ---------- estrutura / encadeamento ----------
  { id: 'G01', grupo: 'estrutura', titulo: 'se_ocê_quiser / se_não se_ocê_quiser / se_não encadeado', gs: L('uai x é 3;', 'se_ocê_quiser (x maior_que 5) { prosa("a"); } se_não se_ocê_quiser (x maior_que 2) { prosa("b"); } se_não { prosa("c"); }'), esperado: 'b', classe: 'controle' },
  { id: 'G02', grupo: 'estrutura', titulo: 'se_num_for', gs: L('uai x é 1;', 'se_ocê_quiser (x maior_que 5) { prosa("a"); } se_num_for (x menor_que 2) { prosa("b"); } se_não { prosa("c"); }'), esperado: 'b', classe: 'controle' },
  { id: 'G03', grupo: 'estrutura', titulo: 'for-of com `de` e for com vai_indo', gs: L('uai lista é [10, 20];', 'vai_indo (uai x de lista) { prosa(x); }', 'vai_indo (trem i é 0; i menor_que 2; i é i mais 1) { prosa(i); }'), esperado: '10\n20\n0\n1', classe: 'controle' },
  { id: 'G04', grupo: 'estrutura', titulo: 'classe com herança, super, static e ocê', gs: L(
    'arruma_trem Animal {',
    '  aprepara_trem(nome) { ocê.nome é nome; }',
    '  falar() { faz_favor ocê.nome mais " faz barulho"; }',
    '  num_muda criar(n) { faz_favor faz_um Animal(n); }',
    '}',
    'arruma_trem Cachorro inherda_de Animal {',
    '  aprepara_trem(nome) { super(nome); }',
    '  falar() { faz_favor super.falar() mais " - au"; }',
    '}',
    'prosa(faz_um Cachorro("Rex").falar());',
    'prosa(Animal.criar("Tom").falar());',
    'prosa(faz_um Cachorro("Rex") é_tipo_de Animal);'), esperado: 'Rex faz barulho - au\nTom faz barulho\ntrue', classe: 'controle' },
  { id: 'G05', grupo: 'estrutura', titulo: 'async/await + promessa + quando_resolver/se_der_pobrema', gs: L(
    'vai_na_frente_faz_trem soma() {',
    '  uai v é espera_um_cadim faz_um promessa((resolve_aí) => resolve_aí(40 mais 2));',
    '  faz_favor v;',
    '}',
    'soma().quando_resolver(v => prosa("v=" mais v)).se_der_pobrema(e => prosa("erro"));'), esperado: 'v=42', classe: 'controle' },
  { id: 'G06', grupo: 'estrutura', titulo: 'tenta_aí / se_der_ruim / por_fim + vixe(...)', gs: L(
    'tenta_aí {',
    '  vixe("quebrou");',
    '} se_der_ruim (e) {',
    '  prosa("pegou:", e.message);',
    '} por_fim {',
    '  prosa("fim");',
    '}'), esperado: 'pegou: quebrou\nfim', classe: 'controle' },
  { id: 'G07', grupo: 'estrutura', titulo: 'enquanto_tiver + para_com_isso com espaço antes do `}`', gs: L('trem i é 0;', 'enquanto_tiver (i menor_que 10) { i é i mais 1; se_ocê_quiser (i é_igualim 3) { para_com_isso }', '}', 'prosa(i);'), esperado: '3', classe: 'controle' },
  { id: 'G08', grupo: 'estrutura', titulo: 'funções: declaração, anônima e arrow', gs: L('faz_trem dobra(a) { faz_favor a vezes 2; }', 'uai tripla é faz_trem(a) { faz_favor a vezes 3; };', 'uai soma é (a, b) => a mais b;', 'prosa(dobra(4), tripla(4), soma(4, 4));'), esperado: '8 12 8', classe: 'controle' },

  // ---------- keywords seguidas de pontuação (lista de delimitadores incompleta) ----------
  { id: 'G09', grupo: 'estrutura', titulo: '`continua_aí;` e `para_com_isso;` com ponto-e-vírgula', gs: L(
    'vai_indo (trem i é 0; i menor_que 5; i é i mais 1) {',
    '  se_ocê_quiser (i é_igualim 2) { continua_aí; }',
    '  se_ocê_quiser (i é_igualim 4) { para_com_isso; }',
    '  prosa(i);',
    '}'), esperado: '0\n1\n3', sev: 'HIGH', classe: 'defeito', nota: '`;` não está no conjunto de delimitadores finais das keywords com underscore/acento' },
  { id: 'G10', grupo: 'estrutura', titulo: '`faz_favor;` (return vazio)', gs: L('faz_trem f(x) { se_ocê_quiser (x) { faz_favor; } prosa("fim"); }', 'f(certeza); f(de_jeito_nenhum);'), esperado: 'fim', sev: 'HIGH', classe: 'defeito' },
  { id: 'G11', grupo: 'estrutura', titulo: 'estilo compacto `tenta_aí{ ... }se_der_ruim(e){ ... }`', gs: 'tenta_aí{ vixe("x"); }se_der_ruim(e){ prosa(e.message); }', esperado: 'x', sev: 'LOW', classe: 'limite-de-design' },
  { id: 'G12', grupo: 'estrutura', titulo: '`faz_favor ocê;` (retorno encadeável)', gs: L(
    'arruma_trem Contador {',
    '  aprepara_trem() { ocê.n é 0; }',
    '  inc() { ocê.n é ocê.n mais 1; faz_favor ocê; }',
    '}',
    'prosa(faz_um Contador().inc().inc().n);'), esperado: '2', sev: 'HIGH', classe: 'defeito', nota: '`ocê` só é traduzido quando seguido de espaço ou ponto e precedido de início/espaço' },
  { id: 'G13', grupo: 'estrutura', titulo: '`(ocê.x)` e `[ocê]` (ocê após parêntese/colchete)', gs: L(
    'arruma_trem P {',
    '  aprepara_trem() { ocê.x é 5; }',
    '  v() { faz_favor (ocê.x mais 1); }',
    '  l() { faz_favor [ocê].tamanho(); }',
    '}',
    'prosa(faz_um P().v(), faz_um P().l());'), esperado: '6 1', sev: 'MEDIUM', classe: 'defeito' },
  { id: 'G14', grupo: 'estrutura', titulo: 'negação dupla `num_é num_é x` (keywords iguais adjacentes)', gs: 'prosa(num_é num_é certeza);', esperado: 'true', sev: 'LOW', classe: 'defeito', nota: 'o delimitador final consumido pela 1ª ocorrência impede a 2ª (regex global com grupo de captura)' },
  { id: 'G15', grupo: 'estrutura', titulo: 'keyword colada em string: `faz_favor"ok"`', gs: 'faz_trem f() { faz_favor"ok"; } prosa(f());', esperado: 'ok', sev: 'LOW', classe: 'limite-de-design' },
];
