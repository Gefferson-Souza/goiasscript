import type { AwaitExpression, JumpStatement, MethodDefinition, ReturnStatement, Super } from '../ast/ast.types.ts';
import type { RawDiagnostic } from '../lexer/token.types.ts';
import { CODES } from './codes.constants.ts';
import { diagnostic } from './diagnostic.ts';
import type { Frame, FrameSpec } from './control-checks.types.ts';

const PROGRAM_FRAME: Frame = { kind: 'program', async: true, loopDepth: 0, classHasParent: false, thisUsed: false };

// Pilha de contextos de função: laço, retorno, await, construtor e a_raiz dependem do que envolve o código.
export class ControlState {
  private frames: readonly Frame[] = [PROGRAM_FRAME];
  private classes: readonly { readonly hasParent: boolean; readonly constructorSeen: boolean }[] = [];

  private get top(): Frame {
    return this.frames.at(-1) ?? PROGRAM_FRAME;
  }

  // A seta usa o `ocê` e o `a_raiz` de fora; o contexto de laço é sempre o da própria função.
  private get home(): Frame {
    return [...this.frames].reverse().find((frame) => frame.kind !== 'arrow') ?? PROGRAM_FRAME;
  }

  get awaitAllowed(): boolean {
    return this.top.async;
  }

  enterFunction(spec: FrameSpec): void {
    this.frames = [...this.frames, { kind: spec.kind, async: spec.async, loopDepth: 0, classHasParent: spec.classHasParent ?? false, thisUsed: false }];
  }

  leaveFunction(): void {
    this.frames = this.frames.slice(0, -1);
  }

  enterLoop(): void {
    this.replaceTop({ ...this.top, loopDepth: this.top.loopDepth + 1 });
  }

  leaveLoop(): void {
    this.replaceTop({ ...this.top, loopDepth: this.top.loopDepth - 1 });
  }

  enterClass(hasParent: boolean): void {
    this.classes = [...this.classes, { hasParent, constructorSeen: false }];
  }

  leaveClass(): void {
    this.classes = this.classes.slice(0, -1);
  }

  get currentClassHasParent(): boolean {
    return this.classes.at(-1)?.hasParent ?? false;
  }

  markThisUsed(): void {
    const home = this.home;
    this.frames = this.frames.map((frame) => (frame === home ? { ...frame, thisUsed: true } : frame));
  }

  registerConstructor(method: MethodDefinition): RawDiagnostic | undefined {
    const current = this.classes.at(-1);
    if (current === undefined) return undefined;
    this.classes = [...this.classes.slice(0, -1), { ...current, constructorSeen: true }];
    return current.constructorSeen ? diagnostic(CODES.duplicateConstructor, method.start, method.end) : undefined;
  }

  checkJump(node: JumpStatement): RawDiagnostic | undefined {
    if (this.top.loopDepth > 0) return undefined;
    return diagnostic(CODES.jumpOutsideLoop, node.start, node.end, { name: node.keywordToken.text });
  }

  checkReturn(node: ReturnStatement): RawDiagnostic | undefined {
    return this.top.kind === 'program' ? diagnostic(CODES.returnOutsideFunction, node.start, node.end) : undefined;
  }

  checkAwait(node: AwaitExpression): RawDiagnostic | undefined {
    return this.awaitAllowed ? undefined : diagnostic(CODES.awaitOutsideAsync, node.start, node.keywordToken.end);
  }

  // `a_raiz(args)` só no construtor de classe que herda, antes de qualquer uso de `ocê`.
  checkSuperCall(node: Super): RawDiagnostic | undefined {
    const home = this.home;
    const valid = home.kind === 'constructor' && home.classHasParent && !home.thisUsed;
    return valid ? undefined : diagnostic(CODES.invalidSuper, node.start, node.end);
  }

  // `a_raiz.metodo(args)` em método ou construtor de classe que herda.
  checkSuperMember(node: Super): RawDiagnostic | undefined {
    const home = this.home;
    const valid = (home.kind === 'method' || home.kind === 'constructor') && home.classHasParent;
    return valid ? undefined : diagnostic(CODES.invalidSuper, node.start, node.end);
  }

  checkBareSuper(node: Super): RawDiagnostic {
    return diagnostic(CODES.invalidSuper, node.start, node.end);
  }

  private replaceTop(frame: Frame): void {
    this.frames = [...this.frames.slice(0, -1), frame];
  }
}
