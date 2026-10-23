export const COPIED_FEEDBACK_MS = 1_500;
export const SHARE_FILE_NAME = 'engoianado.png';
export const SHARE_TEXT = 'Engoianei um trem aqui ó 🐂👇';
export const SHARE_FAILURE_MESSAGE = 'Num consegui gerar a imagem, sô. Tenta de novo.';
export const IDLE_NOTICE = 'O Engoianador tá de folga, sô';
export const RECHECK_LABEL = 'Dá outra olhada, sô';

export const PRIVACY_NOTICE =
  'Cuidado, sô: o texto que ocê mandar vai pra um provedor de LLM e fica guardado em cache por um tempo. Não manda senha, dado pessoal nem segredo.';

export const PRESETS: readonly { readonly label: string; readonly text: string }[] = [
  {
    label: 'Algoritmo de consenso',
    text: 'Explique o que é um algoritmo de consenso em sistemas distribuídos e por que ele é importante.',
  },
  {
    label: 'Programação assíncrona',
    text: 'Explique o que é programação assíncrona e como o async/await funciona.',
  },
  {
    label: 'Por que Rust é melhor que C',
    text: 'Explique por que muita gente acha Rust mais seguro que C para programar.',
  },
  {
    label: 'O que é blockchain',
    text: 'Explique de forma simples o que é uma blockchain e como ela funciona.',
  },
  { label: 'TCP vs UDP', text: 'Explique a diferença entre os protocolos TCP e UDP.' },
];
