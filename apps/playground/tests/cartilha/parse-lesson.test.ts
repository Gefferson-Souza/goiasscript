import { describe, expect, it } from 'vitest';
import { parseLesson } from '../../lib/cartilha/parse-lesson.ts';
import { EXAMPLE_BLOCK, fenced, lessonSource } from '../support/lesson-source.ts';

const noStdin = (): string => '';

describe('parseLesson', () => {
  it('lê frontmatter e blocos de uma lição válida', () => {
    const result = parseLesson('licao-01.md', lessonSource(), noStdin);
    if (!result.ok) throw new Error(result.problems.map((problem) => problem.message).join('\n'));
    expect(result.lesson).toMatchObject({ id: 'licao-01', order: 1, title: 'Primeiro programa', terms: ['prosa'] });
    expect(result.lesson.exercise).toMatchObject({ expectedStdout: 'Olá, Goiás!', stdin: '' });
    expect(result.lesson.blocks.map((block) => block.kind)).toEqual(['example', 'static']);
    expect(result.lesson.blocks[0]).toMatchObject({ code: 'prosa("Bão, sô!")', line: 20 });
  });

  it('recusa frontmatter sem id', () => {
    const result = parseLesson('licao-01.md', lessonSource({ id: null }), noStdin);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems[0]?.message).toMatch(/^Ô sô, licao-01\.md:\d+/u);
    expect(result.problems[0]?.message).toContain('id');
  });

  it('recusa mais de um bloco exemplo', () => {
    const result = parseLesson('licao-01.md', lessonSource({ blocks: [EXAMPLE_BLOCK, EXAMPLE_BLOCK] }), noStdin);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems.map((problem) => problem.message).join('\n')).toContain('mais de um bloco exemplo');
  });

  it('recusa lição sem bloco exemplo', () => {
    const result = parseLesson('licao-01.md', lessonSource({ blocks: [fenced('goiasscript', 'prosa("x")')] }), noStdin);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems.map((problem) => problem.message).join('\n')).toContain('sem bloco exemplo');
  });

  it('lê o código esperado de um bloco erro-esperado', () => {
    const blocks = [EXAMPLE_BLOCK, fenced('goiasscript erro-esperado GS0208', 'uai preço é 10,50')];
    const result = parseLesson('licao-01.md', lessonSource({ blocks }), noStdin);
    if (!result.ok) throw new Error('devia aceitar');
    expect(result.lesson.blocks[1]).toMatchObject({ kind: 'expected-error', expectedCode: 'GS0208' });
  });

  it('recusa chave desconhecida, cerca aberta e modificador torto', () => {
    const extra = parseLesson('licao-01.md', lessonSource({ extraKeys: ['bonus: 1'] }), noStdin);
    const open = parseLesson('licao-01.md', `${lessonSource()}\n\`\`\`goiasscript\nprosa("x")\n`, noStdin);
    const odd = parseLesson('licao-01.md', lessonSource({ blocks: [EXAMPLE_BLOCK, fenced('goiasscript maluco', 'prosa("x")')] }), noStdin);
    for (const result of [extra, open, odd]) expect(result.ok).toBe(false);
  });

  it('recusa arquivo sem cabeçalho e YAML torto', () => {
    expect(parseLesson('licao-01.md', 'sem cabeçalho\n', noStdin).ok).toBe(false);
    expect(parseLesson('licao-01.md', '---\nid: [\n---\n', noStdin).ok).toBe(false);
  });

  it('lê o stdinFile pelo leitor injetado e acusa arquivo que não abre', () => {
    const source = lessonSource({ stdinFile: 'stdin/licao-01.txt' });
    const ok = parseLesson('licao-01.md', source, () => 'Pequi\n');
    if (!ok.ok) throw new Error('devia aceitar');
    expect(ok.lesson.exercise.stdin).toBe('Pequi\n');
    const broken = parseLesson('licao-01.md', source, () => {
      throw new Error('ENOENT');
    });
    expect(broken.ok).toBe(false);
  });
});
