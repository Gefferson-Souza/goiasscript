import type { Expr, ProgramShape, Stmt } from './program-shape.types.ts';

const INDENT = '  ';

function printExpr(expr: Expr): string {
  switch (expr.kind) {
    case 'number': return String(expr.value);
    case 'name': return expr.name;
    case 'binary': return `(${printExpr(expr.left)} ${expr.operator} ${printExpr(expr.right)})`;
    case 'call': return `${expr.callee}(${expr.args.map(printExpr).join(', ')})`;
  }
}

function printBlock(body: readonly Stmt[], depth: number): string {
  const inner = body.map((stmt) => printStmt(stmt, depth + 1)).join('\n');
  return `{\n${inner}\n${INDENT.repeat(depth)}}`;
}

function printStmt(stmt: Stmt, depth: number): string {
  const pad = INDENT.repeat(depth);
  switch (stmt.kind) {
    case 'declaration': return `${pad}${stmt.keyword} ${stmt.name} é ${printExpr(stmt.init)}`;
    case 'expression': return `${pad}${printExpr(stmt.expr)}`;
    case 'if': return `${pad}se_ocê_quiser (${printExpr(stmt.test)}) ${printBlock(stmt.body, depth)}`;
    case 'function': return `${pad}faz_trem ${stmt.name}(${stmt.params.join(', ')}) ${printBlock(stmt.body, depth)}`;
  }
}

export const printProgram = (program: ProgramShape): string => program.map((stmt) => printStmt(stmt, 0)).join('\n');
