import type { Tone } from '@goiasscript/compiler';

export type CommandId = 'translate' | 'run' | 'check' | 'scaffold' | 'explain' | 'info';
export type OptionName = 'output' | 'optimize' | 'minify' | 'overwrite' | 'json' | 'tone';

export interface CommandOptions {
  readonly output?: string;
  readonly optimize: boolean;
  readonly minify: boolean;
  readonly overwrite: boolean;
  readonly json: boolean;
  readonly tone: Tone;
}

export interface ParsedCommand {
  readonly command: CommandId;
  readonly positionals: readonly string[];
  readonly options: CommandOptions;
}

export type ParseResult =
  | { readonly ok: true; readonly parsed: ParsedCommand }
  | { readonly ok: false; readonly detail: string };

export interface CommandSpec {
  readonly id: CommandId;
  readonly name: string;
  readonly asciiName?: string;
  readonly summary: string;
  readonly neutralSummary: string;
  readonly usage: string;
  readonly options: readonly OptionName[];
  readonly positionalNoun: string;
  readonly positionals: { readonly min: number; readonly max: number };
  readonly acceptsStdin: boolean;
}

export interface OptionSpec {
  readonly flag: string;
  readonly short?: string;
  readonly type: 'string' | 'boolean';
  readonly summary: string;
  readonly neutralSummary: string;
}

export interface OptionToken {
  readonly name: string;
  readonly rawName: string;
  readonly value: string | undefined;
}
