import { defineDiagnostic as d, tones as t } from './define-diagnostic.ts';
import type { DiagnosticDefinition } from './diagnostics.types.ts';

export const HINTS_DIAGNOSTICS: readonly DiagnosticDefinition[] = [
  d('GS0801', 'warning', 'é como condição', t('Dentro do "{construct}" cê usou "é", que guarda valor. Pra comparar é "é_igualim".', 'Na condição foi usado "é" (atribuição). Para comparar, use "é_igualim".'), 'trem x é 1\nse_ocê_quiser (x é 2) { prosa(x) }', { lesson: 'licao-04' }),
  d('GS0802', 'warning', 'Laço sem saída aparente', t('Esse laço parece não ter saída, sô. Falta um "para_com_isso"?', 'O laço não parece ter saída. Falta um "para_com_isso"?'), 'enquanto_tiver (certeza) { prosa(1) }', { lesson: 'licao-05' }),
  d('GS0803', 'warning', 'Código depois de faz_favor', t('Esse código nunca roda: vem depois do "faz_favor".', 'Código inalcançável depois de "faz_favor".'), 'faz_trem f() {\n  faz_favor 1\n  prosa(2)\n}', { lesson: 'licao-07' }),
  d('GS0804', 'warning', 'Declaração esconde nome da biblioteca', t('Cuidado, sô: "{name}" já é nome da biblioteca. O seu esconde o dela aqui.', '"{name}" esconde um nome da biblioteca padrão neste escopo.'), 'uai Data é 1'),
  d('GS0805', 'warning', 'Vírgula decimal em argumentos', t('Ô sô, "{text}" vira dois valores (a vírgula separa). Decimal é com ponto.', '"{text}" é lido como dois valores. Use ponto decimal.'), 'prosa(1.000,50)', { lesson: 'licao-11' }),
  d('GS0806', 'warning', 'Expressão sem efeito', t('Esse trem não faz nada, sô.[[ Pra recalcular, é "{suggestion}".]]', 'A expressão não tem efeito.[[ Para recalcular, use "{suggestion}".]]'), 'trem i é 0\ni mais 1'),
  d('GS0807', 'warning', 'Erro passado direto', t('Passou o erro direto pro "{name}", sô. Usa "erro.mensagem".', 'O erro foi passado direto para "{name}". Use "erro.mensagem".'), 'tenta_aí {\n  vixe("a")\n} se_der_ruim (erro) {\n  prosa(erro)\n}', { lesson: 'licao-10' }),
  d('GS0809', 'warning', 'Acesso por texto a nome da biblioteca', t('Acessar por texto não troca o nome da biblioteca, sô. Usa o ponto.', 'O acesso por texto não é traduzido para a biblioteca. Use ".".'), 'uai l é []\nprosa(l["mapear"])'),
];
