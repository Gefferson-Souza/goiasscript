import type { OptionName, OptionSpec } from './args.types.ts';

export const OPTIONS: Readonly<Record<OptionName, OptionSpec>> = {
  output: { flag: '--saida', short: 's', type: 'string', summary: 'arquivo de saída', neutralSummary: 'arquivo de saída' },
  optimize: { flag: '--otimiza', type: 'boolean', summary: 'deixa o JavaScript mais enxuto', neutralSummary: 'otimiza o JavaScript gerado' },
  minify: { flag: '--minifica', type: 'boolean', summary: 'aperta o JavaScript até não caber mais nada', neutralSummary: 'minifica o JavaScript gerado' },
  overwrite: { flag: '--sobrescreve', type: 'boolean', summary: 'troca o arquivo de saída que já existe', neutralSummary: 'substitui o arquivo de saída existente' },
  json: { flag: '--json', type: 'boolean', summary: 'diagnósticos em JSON pra outras ferramentas', neutralSummary: 'diagnósticos em JSON para ferramentas' },
  tone: { flag: '--tom', type: 'string', summary: 'raiz (padrão) ou neutro', neutralSummary: 'raiz (padrão) ou neutro' },
};
