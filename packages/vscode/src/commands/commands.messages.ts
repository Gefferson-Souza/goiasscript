import type { Tone } from '@goiasscript/compiler';
import type { GuardRefusal } from './commands.types.ts';

interface CommandMessages {
  readonly refusal: Readonly<Record<GuardRefusal, string>>;
  readonly spawnFailed: string;
  readonly translateFailed: string;
  readonly askOverwrite: string;
}

const ROOT_MESSAGES: CommandMessages = {
  refusal: {
    'not-file': 'Ô sô, só dá pra mexer em arquivo salvo no disco; esse aí não é.',
    'not-goiasscript': 'Ô sô, abre um arquivo .gs antes de usar esse comando.',
    untrusted: 'Esse trem executa o programa, então a pasta precisa de confiança. Confia na pasta e chama o comando de novo, sô.',
  },
  spawnFailed: 'Eita! Não consegui pôr o GoiásScript pra funcionar. Tenta reinstalar a extensão, sô.',
  translateFailed: 'Ô rapaz! Deu ruim na tradução; os detalhes tão no canal "GoiásScript".',
  askOverwrite: 'Já tem um arquivo de saída aí, sô. Quer sobrescrever?',
};

const NEUTRAL_MESSAGES: CommandMessages = {
  refusal: {
    'not-file': 'Só é possível usar este comando em arquivos salvos no disco.',
    'not-goiasscript': 'Abra um arquivo .gs antes de usar este comando.',
    untrusted: 'Este comando executa o programa, então a pasta precisa ser confiável. Confie na pasta e chame o comando de novo.',
  },
  spawnFailed: 'Não foi possível iniciar o GoiásScript. Tente reinstalar a extensão.',
  translateFailed: 'A tradução falhou; os detalhes estão no canal "GoiásScript".',
  askOverwrite: 'O arquivo de saída já existe. Deseja sobrescrever?',
};

export const messagesFor = (tone: Tone): CommandMessages => (tone === 'neutro' ? NEUTRAL_MESSAGES : ROOT_MESSAGES);
