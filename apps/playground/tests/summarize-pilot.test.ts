import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { parsePilotAnswer, runSummarizePilot, summarizePilot } from '../scripts/summarize-pilot.ts';
import type { PilotAnswer } from '../scripts/summarize-pilot.types.ts';

const FIXTURES = fileURLToPath(new URL('./fixtures/pilot/', import.meta.url));
const FIRST_FIVE = ['licao-01', 'licao-02', 'licao-03', 'licao-04', 'licao-05'] as const;

function answer(learnerId: string, lessonsCompleted: unknown, overrides: Readonly<Record<string, unknown>> = {}): unknown {
  return { learnerId, origin: 'goias', lessonsCompleted, confusingMessages: [], confusingLessons: [], ...overrides };
}

function mustParse(raw: unknown): PilotAnswer {
  const result = parsePilotAnswer(raw);
  if (!result.ok) throw new Error(result.reason);
  return result.answer;
}

function run(dir: string): { code: number; out: string; err: string } {
  let out = '';
  let err = '';
  const code = runSummarizePilot({ dir }, { out: (text) => (out += text), err: (text) => (err += text) });
  return { code, out, err };
}

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('summarizePilot', () => {
  it('conta aprendizes com as lições 1 a 5 concluídas', () => {
    const answers = [mustParse(answer('A1', FIRST_FIVE)), mustParse(answer('A2', ['licao-01', 'licao-02'])), mustParse(answer('A3', [...FIRST_FIVE, 'licao-06']))];
    const summary = summarizePilot(answers);
    expect(summary.learners).toBe(3);
    expect(summary.completedLessons1to5).toBe(2);
    expect(summary.s8Met).toBe(false);
  });

  it('S8 atendido com 3 aprendizes', () => {
    const answers = ['A1', 'A2', 'A3'].map((id) => mustParse(answer(id, FIRST_FIVE)));
    expect(summarizePilot(answers)).toMatchObject({ completedLessons1to5: 3, s8Met: true });
  });

  it('ordena os códigos e as lições mais citados, com desempate estável', () => {
    const message = (code: string) => ({ code, comment: 'Confuso.' });
    const lesson = (lessonId: string) => ({ lessonId, comment: 'Comprida.' });
    const answers = [
      mustParse(answer('A1', [], { confusingMessages: [message('GS0401'), message('GS0208')], confusingLessons: [lesson('licao-04')] })),
      mustParse(answer('A2', [], { confusingMessages: [message('GS0208')], confusingLessons: [lesson('licao-02'), lesson('licao-04')] })),
    ];
    const summary = summarizePilot(answers);
    expect(summary.topCodes).toEqual([{ key: 'GS0208', count: 2 }, { key: 'GS0401', count: 1 }]);
    expect(summary.topLessons).toEqual([{ key: 'licao-04', count: 2 }, { key: 'licao-02', count: 1 }]);
  });

  it('sem respostas devolve 0 de 3 e pendente', () => {
    expect(summarizePilot([])).toMatchObject({ learners: 0, completedLessons1to5: 0, s8Met: false });
  });
});

describe('parsePilotAnswer', () => {
  it('aceita uma resposta anonimizada válida', () => {
    expect(parsePilotAnswer(answer('A1', FIRST_FIVE)).ok).toBe(true);
  });

  it.each(['fulano@exemplo.com', 'liga em (62) 99999-1234', 'meu zap 62999991234', 'tel +55 62 3333 4444'])('recusa resposta com contato no comentário (%s)', (comment) => {
    const raw = answer('A1', [], { confusingMessages: [{ code: 'GS0208', comment }] });
    expect(parsePilotAnswer(raw)).toMatchObject({ ok: false });
    const lessonRaw = answer('A1', [], { confusingLessons: [{ lessonId: 'licao-01', comment }] });
    expect(parsePilotAnswer(lessonRaw)).toMatchObject({ ok: false });
  });

  it.each(['A0', 'A10', 'a1', 'Maria', '', 'B1'])('recusa learnerId fora de A1..A9 (%s)', (learnerId) => {
    expect(parsePilotAnswer(answer(learnerId, []))).toMatchObject({ ok: false });
  });

  it('recusa campo desconhecido, origem inválida, código e lição malformados', () => {
    expect(parsePilotAnswer(answer('A1', [], { city: 'Goiânia' }))).toMatchObject({ ok: false });
    expect(parsePilotAnswer(answer('A1', [], { origin: 'mundo' }))).toMatchObject({ ok: false });
    expect(parsePilotAnswer(answer('A1', ['aula-1']))).toMatchObject({ ok: false });
    expect(parsePilotAnswer(answer('A1', [], { confusingMessages: [{ code: 'X1', comment: 'a' }] }))).toMatchObject({ ok: false });
    expect(parsePilotAnswer(answer('A1', [], { confusingLessons: [{ lessonId: 'x', comment: 'a' }] }))).toMatchObject({ ok: false });
    expect(parsePilotAnswer(null)).toMatchObject({ ok: false });
    expect(parsePilotAnswer('texto')).toMatchObject({ ok: false });
    expect(parsePilotAnswer(answer('A1', 'licao-01'))).toMatchObject({ ok: false });
    expect(parsePilotAnswer(answer('A1', [], { confusingMessages: 'nada' }))).toMatchObject({ ok: false });
    expect(parsePilotAnswer(answer('A1', [], { confusingMessages: [{ code: 'GS0208', comment: 'a', extra: 1 }] }))).toMatchObject({ ok: false });
  });
});

describe('runSummarizePilot', () => {
  it('sem respostas imprime 0/3 e pendente do dono', () => {
    const result = run(join(FIXTURES, 'empty'));
    expect(result.code).toBe(0);
    expect(result.out).toContain('0/3 — pendente do dono');
  });

  it('diretório inexistente também conta como sem respostas', () => {
    const result = run(join(FIXTURES, 'nao-existe'));
    expect(result.code).toBe(0);
    expect(result.out).toContain('0/3 — pendente do dono');
  });

  it('com 3 aprendizes que concluíram imprime o resumo em goianês', () => {
    const result = run(join(FIXTURES, 'three-done'));
    expect(result.code).toBe(0);
    expect(result.out).toContain('3/3');
    expect(result.out).toContain('Deu bom');
    expect(result.out).toContain('GS0208');
    expect(result.out).toContain('licao-03');
  });

  it('com menos de 3 concluintes mostra a contagem e diz que falta gente', () => {
    const result = run(join(FIXTURES, 'mixed'));
    expect(result.code).toBe(0);
    expect(result.out).toContain('1/3');
    expect(result.out).not.toContain('Deu bom');
  });

  it('recusa o diretório inteiro quando uma resposta tem e-mail', () => {
    const result = run(join(FIXTURES, 'invalid'));
    expect(result.code).toBe(1);
    expect(result.err).toContain('A1.json');
    expect(result.out).toBe('');
  });

  it('recusa arquivo que não é JSON e learnerId repetido', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pilot-'));
    tempDirs.push(dir);
    writeFileSync(join(dir, 'A1.json'), '{ quebrado');
    expect((run(dir)).code).toBe(1);
    writeFileSync(join(dir, 'A1.json'), JSON.stringify(answer('A1', [])));
    writeFileSync(join(dir, 'A2.json'), JSON.stringify(answer('A1', [])));
    const duplicated = run(dir);
    expect(duplicated.code).toBe(1);
    expect(duplicated.err).toContain('A1');
  });
});

describe('runSummarizePilot com arquivos fora do padrão', () => {
  function dirWith(files: Readonly<Record<string, string>>): string {
    const dir = mkdtempSync(join(tmpdir(), 'pilot-'));
    tempDirs.push(dir);
    for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
    return dir;
  }
  const valid = JSON.stringify(answer('A2', FIRST_FIVE));

  // A2.json é o arquivo válido: A1.json colidiria com a1.json em sistemas de arquivos sem distinção de caixa.
  it.each(['a1.json', 'A10.json', 'A1.JSON', 'A1.json.bak', 'notas.txt', 'maria.json'])('recusa o arquivo %s em respostas', (name) => {
    const result = run(dirWith({ 'A2.json': valid, [name]: valid }));
    expect(result.code).toBe(1);
    expect(result.err).toContain(name);
  });

  it('aceita o .gitkeep ao lado das respostas', () => {
    expect(run(dirWith({ '.gitkeep': '', 'A1.json': valid })).code).toBe(0);
  });

  it('recusa comentário com mais de 280 caracteres', () => {
    const raw = answer('A1', [], { confusingLessons: [{ lessonId: 'licao-01', comment: 'a'.repeat(281) }] });
    expect(parsePilotAnswer(raw)).toMatchObject({ ok: false });
    const ok = answer('A1', [], { confusingLessons: [{ lessonId: 'licao-01', comment: 'a'.repeat(280) }] });
    expect(parsePilotAnswer(ok).ok).toBe(true);
  });
});
