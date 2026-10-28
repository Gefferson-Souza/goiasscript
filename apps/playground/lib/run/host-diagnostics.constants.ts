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
  compileFailure: {
    message: 'Eita! Num consegui preparar o programa pra rodar.',
    help: 'Confere o código e tenta de novo. Se repetir, recarrega a página.',
  },
  messagesFailure: {
    message: 'Ô sô! Os textos dos avisos de erro não carregaram.',
    help: 'Vê se a rede tá firme e mexe no código pra tentar de novo. Se continuar assim, recarrega a página.',
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
  compileFailure: {
    message: 'O programa não pôde ser preparado para execução.',
    help: 'Confira o código e tente novamente. Se repetir, recarregue a página.',
  },
  messagesFailure: {
    message: 'Os textos dos avisos de erro não puderam ser carregados.',
    help: 'Verifique a conexão e edite o código para tentar de novo. Se persistir, recarregue a página.',
  },
};
