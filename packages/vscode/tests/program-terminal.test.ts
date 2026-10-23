import { describe, expect, it } from 'vitest';
import { createProgramTerminal } from '../src/commands/program-terminal.ts';
import { runProgram } from '../src/commands/run-program.ts';
import { sanitizeTerminalText } from '../src/commands/sanitize-terminal-text.ts';
import { createFakeExecFile } from './support/fake-exec-file.ts';
import { createFakeHost } from './support/fake-host.ts';

const ESC = String.fromCharCode(0x1b);
const BEL = String.fromCharCode(0x07);
const CTRL_C = '\u0003';
const RUNTIME = '/usr/bin/node';

function setupProgram(documentOverrides: { readonly fsPath?: string; readonly trusted?: boolean } = {}) {
  const base = createFakeHost();
  const activeDocument = base.makeDocument(documentOverrides.fsPath === undefined ? {} : { fsPath: documentOverrides.fsPath });
  const host = createFakeHost({ activeDocument, trusted: documentOverrides.trusted ?? true });
  const exec = createFakeExecFile({ manual: true });
  const handler = runProgram({ host, execFile: exec.execFile, runtimePath: RUNTIME });
  return { host, exec, handler };
}

describe('sanitizeTerminalText', () => {
  it('remove ESC, BEL, C1, bidi e separadores de linha, e preserva a quebra de linha', () => {
    const invisible = [0x9b, 0x202e, 0x2066, 0x2028, 0x2029].map((code) => String.fromCodePoint(code)).join('|');
    const hostile = `a${ESC}[31m${BEL}${invisible}f\ng`;
    expect(sanitizeTerminalText(hostile)).toBe('a[31m||||f\ng');
  });

  it('não mexe em acentos, tabulação nem emoji', () => {
    expect(sanitizeTerminalText('\tação 🚀')).toBe('\tação 🚀');
  });
});

describe('createProgramTerminal', () => {
  it('neutraliza o título e abre o terminal pelo host', () => {
    const host = createFakeHost();
    createProgramTerminal(host, `a${ESC}]0;falso${BEL}.gs`);
    expect(host.terminals).toHaveLength(1);
    expect(host.terminals[0]?.title).not.toContain(ESC);
    expect(host.terminals[0]?.title).not.toContain(BEL);
  });

  it('escreve \\r\\n no lugar de \\n e neutraliza o texto', () => {
    const host = createFakeHost();
    const terminal = createProgramTerminal(host, 'a.gs');
    terminal.write(`oi${ESC}[2J\nsô\n`);
    expect(host.terminals[0]?.written.join('')).toBe('oi[2J\r\nsô\r\n');
  });

  it('ecoa a digitação e entrega a linha ao apertar Enter', () => {
    const host = createFakeHost();
    const terminal = createProgramTerminal(host, 'a.gs');
    const lines: string[] = [];
    terminal.onLine((line) => lines.push(line));
    host.terminals[0]?.type('oi');
    host.terminals[0]?.type('\r');
    expect(lines).toEqual(['oi']);
    expect(host.terminals[0]?.written.join('')).toBe('oi\r\n');
  });

  it('apaga com backspace, sem enviar o caractere apagado', () => {
    const host = createFakeHost();
    const terminal = createProgramTerminal(host, 'a.gs');
    const lines: string[] = [];
    terminal.onLine((line) => lines.push(line));
    host.terminals[0]?.type('ab\u007fc\r');
    expect(lines).toEqual(['ac']);
  });

  it('neutraliza o eco de texto colado', () => {
    const host = createFakeHost();
    const terminal = createProgramTerminal(host, 'a.gs');
    terminal.onLine(() => undefined);
    host.terminals[0]?.type(`a${ESC}[2Jb\r`);
    expect(host.terminals[0]?.written.join('')).not.toContain(ESC);
  });

  it('Ctrl+C chama o interruptor', () => {
    const host = createFakeHost();
    const terminal = createProgramTerminal(host, 'a.gs');
    let interrupted = 0;
    terminal.onInterrupt(() => {
      interrupted += 1;
    });
    host.terminals[0]?.type(CTRL_C);
    expect(interrupted).toBe(1);
  });

  it('avisa quando o usuário fecha o terminal', () => {
    const host = createFakeHost();
    const terminal = createProgramTerminal(host, 'a.gs');
    let closed = 0;
    terminal.onClose(() => {
      closed += 1;
    });
    host.terminals[0]?.closeByUser();
    expect(closed).toBe(1);
  });

  it('fecha o terminal do host com o código de saída', () => {
    const host = createFakeHost();
    createProgramTerminal(host, 'a.gs').close(7);
    expect(host.terminals[0]?.exitCodes).toEqual([7]);
  });
});

describe('runProgram', () => {
  it('executa o bota_pra_moer com o arquivo depois de -- e sem shell', async () => {
    const { exec, handler } = setupProgram();
    await handler();
    expect(exec.calls).toHaveLength(1);
    expect(exec.calls[0]?.args).toEqual(['/extension/dist/cli/goiasscript.mjs', 'bota_pra_moer', '--tom', 'raiz', '--', '/work/programa.gs']);
    expect(exec.calls[0]?.options).not.toHaveProperty('shell');
  });

  it('recusa em workspace não confiável e não executa nada, nem ao conceder a confiança', async () => {
    const { exec, handler, host } = setupProgram({ trusted: false });
    await handler();
    expect(exec.calls).toHaveLength(0);
    expect(host.terminals).toHaveLength(0);
    expect(host.errors[0]).toContain('confia');
    host.grantTrust();
    expect(exec.calls).toHaveLength(0);
  });

  it('o título do terminal é o nome do arquivo neutralizado', async () => {
    const { host, handler } = setupProgram({ fsPath: `/work/a${ESC}]0;x${BEL}.gs` });
    await handler();
    expect(host.terminals[0]?.title).toBe('a]0;x.gs');
  });

  it('liga stdout e stderr do filho ao terminal, neutralizando os bytes de controle', async () => {
    const { exec, handler, host } = setupProgram();
    await handler();
    exec.children[0]?.emitStdout(`oi${ESC}[2J\n`);
    exec.children[0]?.emitStderr('erro\n');
    expect(host.terminals[0]?.written.join('')).toBe('oi[2J\r\nerro\r\n');
  });

  it('a entrada digitada vai ao stdin do filho com \\n (pergunta funciona)', async () => {
    const { exec, handler, host } = setupProgram();
    await handler();
    host.terminals[0]?.type('Maria');
    host.terminals[0]?.type('\r');
    expect(exec.children[0]?.stdinWritten).toEqual(['Maria\n']);
  });

  it('Ctrl+C e fechar o terminal matam o processo', async () => {
    const { exec, handler, host } = setupProgram();
    await handler();
    host.terminals[0]?.type(CTRL_C);
    expect(exec.children[0]?.killCount).toBe(1);
    host.terminals[0]?.closeByUser();
    expect(exec.children[0]?.killCount).toBe(2);
  });

  it('o processo que termina fecha o terminal com o código de saída', async () => {
    const { exec, handler, host } = setupProgram();
    await handler();
    exec.children[0]?.finish({ exitCode: 2, stdout: '', stderr: '' });
    expect(host.terminals[0]?.exitCodes).toEqual([2]);
  });

  it('saída zero fecha com zero', async () => {
    const { exec, handler, host } = setupProgram();
    await handler();
    exec.children[0]?.finish({ exitCode: 0, stdout: '', stderr: '' });
    expect(host.terminals[0]?.exitCodes).toEqual([0]);
  });

  it('falha ao iniciar escreve aviso em goianês no terminal e fecha com erro', async () => {
    const { exec, handler, host } = setupProgram();
    await handler();
    exec.children[0]?.finish({ exitCode: 1, stdout: '', stderr: '', spawnErrorCode: 'ENOENT' });
    expect(host.terminals[0]?.written.join('')).not.toMatch(/spawn|Error:/u);
    expect(host.terminals[0]?.written.join('').length).toBeGreaterThan(0);
    expect(host.terminals[0]?.exitCodes).toEqual([1]);
  });
});
