import { defineDiagnostic as d, tones as t } from './define-diagnostic.ts';
import type { DiagnosticDefinition } from './diagnostics.types.ts';

export const TOOLS_DIAGNOSTICS: readonly DiagnosticDefinition[] = [
  d('GS0901', 'error', 'Erro interno do compilador', t('Ô sô, deu erro dentro do compilador. Isso é bug nosso: relata, por favor.', 'Erro interno do compilador. Relate o problema, por favor.'), ''),
  d('GS0902', 'error', 'Arquivo sem .gs', t('Ô sô, o arquivo precisa terminar em ".gs".', 'O arquivo de entrada precisa terminar em ".gs".'), ''),
  d('GS0903', 'error', 'Saída igual à entrada ou destino existente', t('Ô sô, essa saída não rola: {reason}.[[ Usa "{override}" se quiser trocar.]]', 'Saída recusada: {reason}.[[ Use "{override}" para substituir.]]'), ''),
  d('GS0904', 'warning', 'Node abaixo do mínimo', t('Seu Node é antigo, sô. Precisa do {minimum} ou mais.', 'Versão do Node abaixo do mínimo ({minimum}).'), ''),
  d('GS0905', 'error', 'Uso incorreto do CLI', t('Ô sô, esse comando ou opção não existe. Dá uma olhada em "dedo_de_prosa".', 'Comando ou opção desconhecidos.'), ''),
];
