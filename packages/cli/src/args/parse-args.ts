import { parseArgs } from 'node:util';
import type { Tone } from '@goiasscript/compiler';
import { COMMANDS } from './commands.data.ts';
import { OPTIONS } from './options.data.ts';
import { resolveCommandName } from './resolve-command.ts';
import type { CommandOptions, CommandSpec, OptionName, OptionToken, ParseResult } from './args.types.ts';

type Fail = { readonly ok: false; readonly detail: string };
type OptionValues = Partial<Record<OptionName, string | true>>;
type ParseArgsOption = { readonly type: 'string' | 'boolean'; readonly short?: string };

const TONES: readonly string[] = ['raiz', 'neutro'];
const HELP_LIKE = new Set(['--help', '-h', '--version', '-v', '-V']);
const NAMES = Object.keys(OPTIONS) as readonly OptionName[];
const FLAG_PREFIX = '--';
const flagKey = (name: OptionName): string => OPTIONS[name].flag.slice(FLAG_PREFIX.length);
const NAME_BY_FLAG: ReadonlyMap<string, OptionName> = new Map(NAMES.map((name) => [flagKey(name), name]));
const PARSE_ARGS_OPTIONS: Record<string, ParseArgsOption> = Object.fromEntries(
  NAMES.map((name) => [flagKey(name), { type: OPTIONS[name].type, ...(OPTIONS[name].short === undefined ? {} : { short: OPTIONS[name].short }) }]),
);

const fail = (detail: string): Fail => ({ ok: false, detail });
const isTone = (value: string): value is Tone => TONES.includes(value);

const unknownOptionDetail = (rawName: string): string =>
  HELP_LIKE.has(rawName)
    ? `"${rawName}" não existe aqui. Pra ver o que dá pra fazer, roda "goiasscript" sem nada.`
    : `A opção "${rawName}" não existe nesse comando.`;


function validateOption(spec: CommandSpec, token: OptionToken): Fail | null {
  const name = NAME_BY_FLAG.get(token.name);
  if (name === undefined || !spec.options.includes(name)) return fail(unknownOptionDetail(token.rawName));
  const { type } = OPTIONS[name];
  if (type === 'string' && token.value === undefined) return fail(`A opção "${token.rawName}" precisa de um valor.`);
  if (type === 'boolean' && token.value !== undefined) return fail(`A opção "${token.rawName}" não recebe valor.`);
  return null;
}

function collectOptions(spec: CommandSpec, argv: readonly string[]): { readonly values: OptionValues; readonly positionals: readonly string[] } | Fail {
  const { tokens } = parseArgs({ args: [...argv], options: PARSE_ARGS_OPTIONS, strict: false, allowPositionals: true, tokens: true });
  const optionTokens: readonly OptionToken[] = tokens.flatMap((token) => (token.kind === 'option' ? [token] : []));
  const failure = optionTokens.map((token) => validateOption(spec, token)).find((result) => result !== null);
  if (failure !== undefined) return failure;
  return {
    values: Object.fromEntries(optionTokens.map((token) => [token.name, token.value ?? true] as const).flatMap(([flag, value]) => {
      const name = NAME_BY_FLAG.get(flag);
      return name === undefined ? [] : [[name, value] as const];
    })),
    positionals: tokens.flatMap((token) => (token.kind === 'positional' ? [token.value] : [])),
  };
}

function checkPositionals(spec: CommandSpec, positionals: readonly string[]): Fail | null {
  const { min, max } = spec.positionals;
  if (positionals.length < min) return fail(`Faltou o ${spec.positionalNoun} depois de "${spec.name}".`);
  if (positionals.length > max) {
    const noun = max === 0 ? `"${spec.name}" não recebe ${spec.positionalNoun}` : `"${spec.name}" aceita só um ${spec.positionalNoun} por vez`;
    return fail(`${noun}.`);
  }
  if (!spec.acceptsStdin && positionals.includes('-')) return fail(`"${spec.name}" não lê o programa da entrada padrão ("-"): ela fica pras respostas do programa.`);
  return null;
}

function buildOptions(values: OptionValues): CommandOptions | Fail {
  const tone = typeof values.tone === 'string' ? values.tone : 'raiz';
  if (!isTone(tone)) return fail(`O tom "${tone}" não existe; use "raiz" ou "neutro".`);
  if (values.optimize !== undefined && values.minify !== undefined) return fail('"--otimiza" e "--minifica" não andam juntas; escolhe uma.');
  return {
    ...(typeof values.output === 'string' ? { output: values.output } : {}),
    optimize: values.optimize !== undefined,
    minify: values.minify !== undefined,
    overwrite: values.overwrite !== undefined,
    json: values.json !== undefined,
    tone,
  };
}

const unknownCommandDetail = (typed: string): string => {
  if (HELP_LIKE.has(typed)) return unknownOptionDetail(typed);
  return typed.startsWith('-') ? `O comando vem primeiro; "${typed}" ficou antes dele.` : `O comando "${typed}" não existe.`;
};

const isFail = (value: object): value is Fail => 'ok' in value;

export function parseCommandLine(argv: readonly string[]): ParseResult {
  const [typed, ...rest] = argv;
  if (typed === undefined) return fail('Faltou o comando.');
  const id = resolveCommandName(typed);
  const spec = COMMANDS.find((command) => command.id === id);
  if (spec === undefined) return fail(unknownCommandDetail(typed));
  const collected = collectOptions(spec, rest);
  if (isFail(collected)) return collected;
  const positionalError = checkPositionals(spec, collected.positionals);
  if (positionalError !== null) return positionalError;
  const options = buildOptions(collected.values);
  if (isFail(options)) return options;
  return { ok: true, parsed: { command: spec.id, positionals: collected.positionals, options } };
}
