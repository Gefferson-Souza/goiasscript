'use strict';
const { Command, Help } = require(process.env.CORE + '/node_modules/commander');

const TITULOS = { 'Usage:': 'Uso:', 'Options:': 'Opções:', 'Commands:': 'Comandos:', 'Arguments:': 'Argumentos:' };
const MENSAGENS_DE_ERRO = [
  [/^error: unknown option '(.+)'/, (_, opcao) => `Ô sô! Essa opção '${opcao}' num existe não!`],
  [/^error: unknown command '(.+)'/, (_, comando) => `Ô sô! Num conheço o comando '${comando}' não!`],
  [/^error: missing required argument '(.+)'/, (_, arg) => `Ô sô! Faltou o argumento '${arg}'!`],
  [/^error: option '(.+)' argument missing/, (_, opcao) => `Ô sô! A opção '${opcao}' precisa de um valor!`],
];

const traduzErro = texto => {
  for (const [padrao, formata] of MENSAGENS_DE_ERRO) {
    if (padrao.test(texto)) return texto.replace(padrao, formata);
  }
  return texto;
};

const program = new Command();
program
  .name('goiasscript')
  .description('CLI do GoiásScript')
  .version('1.5.0', '-v, --versão', 'mostra a versão')
  .helpOption('-a, --ajuda', 'mostra essa ajuda')
  .addHelpCommand('ajuda [comando]', 'mostra a ajuda de um comando')
  .showHelpAfterError('(use --ajuda pra ver os comandos)')
  .configureHelp({
    formatHelp: (cmd, helper) =>
      Help.prototype.formatHelp.call(helper, cmd, helper).replace(/^(Usage:|Options:|Commands:|Arguments:)/gm, t => TITULOS[t]),
  })
  .configureOutput({ outputError: (texto, escreve) => escreve(traduzErro(texto)) });

program.command('traduz').argument('<arquivo>', 'arquivo .gs').option('-o, --saida <arquivo>', 'arquivo de saída').description('Traduz pra JavaScript').action(() => {});
program.parse();
