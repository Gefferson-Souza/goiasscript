import { defineDiagnostic as d, tones as t } from './define-diagnostic.ts';
import type { DiagnosticDefinition } from './diagnostics.types.ts';

export const LEXICAL_DIAGNOSTICS: readonly DiagnosticDefinition[] = [
  d('GS0101', 'error', 'Número malformado', t('Ô sô, esse número não rola: sem zero na frente e sem ponto de milhar.', 'Número malformado: não use zero à esquerda nem ponto de milhar.'), 'uai cep é 01310', { help: t('Pra CEP e telefone, usa texto: "01310". O milhar vai sem ponto: 1000000.', 'Para CEP e telefone, use texto: "01310". Escreva o milhar sem ponto: 1000000.'), lesson: 'licao-03' }),
  d('GS0102', 'error', 'Escape inválido em texto', t('Eita, essa barra invertida no texto não vale.', 'Sequência de escape inválida no texto.'), 'uai t é "a\\8"', { lesson: 'licao-03' }),
  d('GS0103', 'error', 'Texto sem fechar', t('Ô sô, faltou fechar as aspas desse texto na mesma linha.', 'O texto não foi fechado na mesma linha.'), 'uai t é "oi', { help: t('Pra juntar várias linhas, usa "mais".', 'Para juntar linhas, use "mais".'), lesson: 'licao-03' }),
  d('GS0104', 'error', 'Caractere inválido em nome', t('Ô sô, "{character}" não vale em nome de trem. Só letra, número e "_".', 'O caractere "{character}" não é permitido em nomes. Use letras, números e "_".'), 'uai $x é 1'),
  d('GS0105', 'error', 'Caractere invisível proibido', t('Ô sô, tem um caractere invisível aí que atrapalha. Apaga ele.', 'Caractere invisível não permitido. Remova-o.'), '// a\u2028b'),
  d('GS0106', 'error', 'Comentário sem fechar', t('Faltou fechar o comentário com "*/", sô.', 'O comentário de bloco não foi fechado com "*/".'), '/* oi'),
  d('GS0107', 'error', 'Caractere desconhecido', t('Ô sô, não conheço esse "{character}" aí.', 'Caractere desconhecido: "{character}".'), 'uai x é 1 @'),
];
