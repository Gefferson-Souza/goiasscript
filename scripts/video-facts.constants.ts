export const CLI_BINARY_NAME = 'goiasscript';
export const DEMO_DIR = 'demo';
export const DEMO_ENTRY_FILE = 'main.gs';
export const SCAFFOLD_COMMAND = 'arma_o_barraco';
export const RUN_COMMAND = 'bota_pra_moer';
export const CHECK_COMMAND = 'vê_se_tá_certo';
export const TRANSLATE_COMMAND = 'traduz';
export const STDIN_MARKER = '-';
export const VAR_KEYWORD_SOURCE = 'trem idade é 30\n';
export const ENGOIANADOR_SAMPLE_TEXT = 'Bom dia, tudo bem com você? Vamos almoçar juntos hoje.';
export const ENGOIANADOR_PATH = '/engoiana';
export const ENGOIANADOR_URL_ENV = 'ENGOIANADOR_URL';
export const ENGOIANADOR_TIMEOUT_MS = 30_000;
export const OUT_FLAG = '--out';
export const TESTS_FROM_FLAG = '--tests-from';
export const TESTS_REPORT_FIELD = 'numTotalTests';
export const TESTS_FAILED_FIELD = 'numFailedTests';
export const HOME_PLACEHOLDER = '<home>';
export const TMP_PLACEHOLDER = '<tmp>';
export const URL_PLACEHOLDER = '<engoianador-url>';
export const SECRET_ENV_NAME = /KEY|TOKEN|SECRET|PASSWORD/iu;
export const MIN_SECRET_LENGTH = 8;
export const JSON_INDENT = 2;
export const CLI_MAX_BUFFER_BYTES = 8_388_608;
export const VITEST_MAX_BUFFER_BYTES = 134_217_728;
export const VITEST_TIMEOUT_MS = 600_000;
export const CLI_MANIFEST_PATH = 'packages/cli/package.json';
export const VITEST_BIN_PATH = 'node_modules/vitest/vitest.mjs';
export const WORK_PREFIX = 'goiasscript-video-facts-';
export const SUCCESS_MESSAGE = 'Tá pronto, sô! Os dados do vídeo foram gravados de execução real.';
export const MESSAGES = {
  missingOut: 'Ô sô! Faltou o --out com o caminho do arquivo, fora do repositório.',
  insideRepository: 'Ô rapaz! O --out não pode cair dentro do repositório. Escolhe uma pasta de fora.',
  secretLeak: 'Eita! Tem segredo no meio dos dados do vídeo. Não gravei nada.',
  invalidReport: `Eita! O relatório de testes não tem o campo ${TESTS_REPORT_FIELD} numérico.`,
  demoCommandFailed: 'Ô sô! Um comando do demo falhou e eu não grampeio comando quebrado no vídeo',
  testRunFailed: 'Eita! A suíte de testes não passou limpa, então não conto o número pro vídeo.',
  translateFailed: 'Ô sô! O traduz falhou e eu não invento saída.',
  engoianadorFailed: 'Eita! O Engoianador respondeu, mas sem texto aproveitável.',
} as const;
