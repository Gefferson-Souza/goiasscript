import fc from 'fast-check';
import type { Expr, ProgramShape, Stmt } from './program-shape.types.ts';

const NAMES = ['a', 'b', 'total', 'public', 'arguments', 'const', 'prosa', 'pergunta'] as const;
const MUTATION_PIECES = ['', ' ', '\n', ';', 'uai', 'mais', 'public', 'arguments', '{', '}'] as const;
const MAX_DEPTH = 4;
const MAX_LIST = 2;
const MAX_STATEMENTS = 6;
const MAX_NUMBER = 1000;

const name = fc.constantFrom(...NAMES);
const operator = fc.constantFrom('mais' as const, 'menos' as const, 'vezes' as const);

const tree = fc.letrec<{ expr: Expr; stmt: Stmt }>((tie) => ({
  expr: fc.oneof(
    { maxDepth: MAX_DEPTH },
    fc.record({ kind: fc.constant('number' as const), value: fc.nat(MAX_NUMBER) }),
    fc.record({ kind: fc.constant('name' as const), name }),
    fc.record({ kind: fc.constant('binary' as const), operator, left: tie('expr'), right: tie('expr') }),
    fc.record({ kind: fc.constant('call' as const), callee: name, args: fc.array(tie('expr'), { maxLength: MAX_LIST }) }),
  ),
  stmt: fc.oneof(
    { maxDepth: MAX_DEPTH },
    fc.record({ kind: fc.constant('declaration' as const), keyword: fc.constantFrom('uai' as const, 'trem' as const), name, init: tie('expr') }),
    fc.record({ kind: fc.constant('expression' as const), expr: tie('expr') }),
    fc.record({ kind: fc.constant('if' as const), test: tie('expr'), body: fc.array(tie('stmt'), { maxLength: MAX_LIST }) }),
    fc.record({ kind: fc.constant('function' as const), name, params: fc.array(name, { maxLength: MAX_LIST }), body: fc.array(tie('stmt'), { maxLength: MAX_LIST }) }),
  ),
}));

export const programArbitrary: fc.Arbitrary<ProgramShape> = fc.array(tree.stmt, { maxLength: MAX_STATEMENTS });

export const mutatedCorpus = (corpus: readonly string[]): fc.Arbitrary<string> =>
  fc.tuple(fc.constantFrom(...corpus), fc.nat(), fc.constantFrom(...MUTATION_PIECES)).map(([text, at, piece]) => {
    const index = at % (text.length + 1);
    return text.slice(0, index) + piece + text.slice(index + (at % 3));
  });
