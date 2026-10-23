import type { HostDiagnosticKind, HostDiagnosticText } from './host-diagnostics.types.ts';

export const HOST_DIAGNOSTIC_CODE = 'GS0714';

type HostDiagnosticTexts = Readonly<Record<HostDiagnosticKind, HostDiagnosticText>>;

export const COLLOQUIAL_TEXTS: HostDiagnosticTexts = {
  loadFailure: {
    message: 'Ô sô! O trem que roda o programa não carregou.',
    help: 'Recarrega a página e tenta de novo. Se continuar assim, a rede ou o navegador tá barrando o arquivo.',
  },
  unreadableMessage: {
    message: 'Eita! Chegou uma resposta que o playground não soube ler.',
    help: 'Roda o programa de novo. Se repetir, recarrega a página.',
  },
};

export const NEUTRAL_TEXTS: HostDiagnosticTexts = {
  loadFailure: {
    message: 'O executor do programa não pôde ser carregado.',
    help: 'Recarregue a página e tente novamente. Se persistir, a rede ou o navegador está bloqueando o arquivo.',
  },
  unreadableMessage: {
    message: 'Uma resposta do executor não pôde ser lida.',
    help: 'Execute o programa novamente. Se repetir, recarregue a página.',
  },
};
