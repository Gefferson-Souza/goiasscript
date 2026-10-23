import ts from 'typescript';

const FILE_NAME = 'ui-source.ts';

function isTextPosition(node: ts.Node): boolean {
  const parent = node.parent;
  if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isLiteralTypeNode(parent) || ts.isImportTypeNode(parent)) return false;
  return !((ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent)) && parent.name === node);
}

function isTextLiteral(node: ts.Node): node is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | ts.TemplateHead | ts.TemplateMiddle | ts.TemplateTail {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node);
}

function visit(node: ts.Node): readonly string[] {
  const own = isTextLiteral(node) && isTextPosition(node) ? [node.text] : [];
  return [...own, ...node.getChildren().flatMap(visit)];
}

export function extractStringLiterals(sourceText: string): readonly string[] {
  const file = ts.createSourceFile(FILE_NAME, sourceText, ts.ScriptTarget.Latest, true);
  return visit(file).filter((text) => text.trim() !== '');
}
