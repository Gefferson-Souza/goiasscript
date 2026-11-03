export const INPUT_ENDED_CODE = 'GS0702';
export const PENDING_PROGRAM_CODE = 'GS0703';

export const PROGRAM_MESSAGE_LABEL = { root: 'o programa disse', neutral: 'mensagem do programa' } as const;
export const PROGRAM_MESSAGE_MAX_LENGTH = 300;
export const OBJECT_AS_MESSAGE = '[object Object]';
export const OBJECT_MESSAGE_NOTE = {
  root: 'o vixe recebeu uma coisa em vez de texto; bota o texto: vixe(faz_um Erro("deu ruim")).',
  neutral: 'o vixe recebeu um objeto em vez de texto; informe o texto: vixe(faz_um Erro("deu ruim")).',
} as const;
