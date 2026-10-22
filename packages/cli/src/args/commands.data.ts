import type { CommandSpec } from './args.types.ts';

export const COMMANDS: readonly CommandSpec[] = [
  {
    id: 'translate', name: 'traduz', summary: 'vira o .gs em JavaScript (.mjs)', neutralSummary: 'compila o .gs para JavaScript (.mjs)',
    usage: 'traduz arquivo.gs [-s saida.mjs] [--otimiza | --minifica] [--sobrescreve] [--json]',
    options: ['output', 'optimize', 'minify', 'overwrite', 'json', 'tone'], positionalNoun: 'arquivo', positionals: { min: 1, max: 1 }, acceptsStdin: true,
  },
  {
    id: 'run', name: 'bota_pra_moer', summary: 'traduz e já executa o programa', neutralSummary: 'compila e executa o programa',
    usage: 'bota_pra_moer arquivo.gs', options: ['tone'], positionalNoun: 'arquivo', positionals: { min: 1, max: 1 }, acceptsStdin: false,
  },
  {
    id: 'check', name: 'vê_se_tá_certo', asciiName: 've_se_ta_certo', summary: 'só confere o programa e mostra todos os problemas', neutralSummary: 'apenas verifica o programa e lista todos os diagnósticos',
    usage: 'vê_se_tá_certo arquivo.gs [--json]', options: ['json', 'tone'], positionalNoun: 'arquivo', positionals: { min: 1, max: 1 }, acceptsStdin: true,
  },
  {
    id: 'scaffold', name: 'arma_o_barraco', summary: 'cria um projeto novo a partir do modelo', neutralSummary: 'cria um projeto a partir do modelo',
    usage: 'arma_o_barraco nome', options: ['tone'], positionalNoun: 'nome', positionals: { min: 1, max: 1 }, acceptsStdin: false,
  },
  {
    id: 'explain', name: 'explica', summary: 'explica um erro com exemplo e lição', neutralSummary: 'explica um diagnóstico com exemplo e lição',
    usage: 'explica [GS0301]', options: ['tone'], positionalNoun: 'código', positionals: { min: 0, max: 1 }, acceptsStdin: false,
  },
  {
    id: 'info', name: 'dedo_de_prosa', summary: 'mostra a versão e umas informações', neutralSummary: 'mostra a versão e informações',
    usage: 'dedo_de_prosa', options: ['tone'], positionalNoun: 'argumento', positionals: { min: 0, max: 0 }, acceptsStdin: false,
  },
];
