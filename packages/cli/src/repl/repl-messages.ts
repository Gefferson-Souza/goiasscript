import type { Tone } from '@goiasscript/compiler';
import { chooseByTone } from '../tone-choice.ts';
import { REPL_COMMANDS } from './repl-commands.data.ts';
import type { ReplCommandId } from './repl-commands.types.ts';

export const MAIN_PROMPT = 'goiás> ';
export const CONTINUATION_PROMPT = '... ';
const INDENT = '  ';
const NAME_COLUMN = 20;

const COMMAND_SUMMARY: Readonly<Record<ReplCommandId, readonly [root: string, neutral: string]>> = {
  help: ['mostra essa lista de comandos', 'mostra esta lista de comandos'],
  bindings: ['mostra os nomes guardados na sessão', 'mostra os nomes guardados na sessão'],
  history: ['lembra o que já foi digitado', 'mostra as entradas aceitas na sessão'],
  clear: ['limpa a tela', 'limpa a tela'],
  reset: ['zera tudo e começa de novo', 'zera a sessão e recomeça'],
  exit: ['vaza daqui', 'sai da roda de prosa'],
};

export const bannerText = (tone: Tone, version: string): string =>
  chooseByTone(
    tone,
    `Roda de Prosa do GoiásScript (${version}). Digita .desenrola pra ver os comandos e .vaza pra sair.\n`,
    `Roda de Prosa do GoiásScript (${version}). Digite .desenrola para ver os comandos e .vaza para sair.\n`,
  );

export const exitHintText = (tone: Tone): string =>
  chooseByTone(tone, '(pra sair, aperta Ctrl+C de novo ou digita .vaza)\n', '(para sair, pressione Ctrl+C de novo ou digite .vaza)\n');

export const interruptedText = (tone: Tone): string =>
  chooseByTone(tone, 'Entrada interrompida, sô. A sessão continua de pé.\n', 'Entrada interrompida. A sessão continua ativa.\n');

export const resetText = (tone: Tone): string => chooseByTone(tone, 'Zerei tudo, sô. Pode começar de novo.\n', 'Sessão zerada. Pode recomeçar.\n');

export const emptyHistoryText = (tone: Tone): string =>
  chooseByTone(tone, 'Ainda não rolou nenhuma entrada, sô.\n', 'Nenhuma entrada aceita ainda.\n');

export const emptyBindingsText = (tone: Tone): string =>
  chooseByTone(tone, 'Nenhum trem guardado ainda, sô.\n', 'Nenhum nome guardado ainda.\n');

export function helpText(tone: Tone): string {
  const lines = REPL_COMMANDS.map((command) => {
    const [root, neutral] = COMMAND_SUMMARY[command.id];
    return `${INDENT}${command.name.padEnd(NAME_COLUMN)}${chooseByTone(tone, root, neutral)}`;
  });
  return `${lines.join('\n')}\n`;
}

export function unknownCommandText(tone: Tone, typed: string, suggestion: string | undefined): string {
  const head = chooseByTone(tone, `Ô sô, o comando "${typed}" não existe na roda de prosa.`, `O comando "${typed}" não existe na roda de prosa.`);
  const hint = suggestion === undefined
    ? chooseByTone(tone, 'Digita .desenrola pra ver os comandos.', 'Digite .desenrola para ver os comandos.')
    : chooseByTone(tone, `Cê quis dizer "${suggestion}"?`, `Você quis dizer "${suggestion}"?`);
  return `${head}\n${INDENT}${hint}\n`;
}
