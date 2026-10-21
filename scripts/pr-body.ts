const REVIEW_HEADING = /^##\s+Revisão\s*$/m;
const NEXT_HEADING = /^##\s/m;
const COMMENT_OPEN = '<!--';
const COMMENT_CLOSE = '-->';
const EMPTY_COMMENT_CLOSE_OFFSET = 2;
const GENERATED_FOOTER = /generated with/i;

function removeFirstComment(text: string): string {
  const start = text.indexOf(COMMENT_OPEN);
  if (start === -1) return text;
  // Busca o fechamento a partir de "<!" + 2 para aceitar "<!-->" e "<!--->", que o HTML trata como comentário vazio.
  const end = text.indexOf(COMMENT_CLOSE, start + EMPTY_COMMENT_CLOSE_OFFSET);
  return end === -1 ? text.slice(0, start) : text.slice(0, start) + text.slice(end + COMMENT_CLOSE.length);
}

// Tirar um comentário pode juntar as pontas de dois pedaços num comentário novo; repete até estabilizar.
function stripHtmlComments(text: string): string {
  const stripped = removeFirstComment(text);
  return stripped === text ? text : stripHtmlComments(stripped);
}

function reviewProblems(body: string): readonly string[] {
  const heading = REVIEW_HEADING.exec(body);
  if (heading === null) return ['o corpo do PR precisa da seção "## Revisão"'];
  const section = body.slice(heading.index + heading[0].length).split(NEXT_HEADING)[0] ?? '';
  return stripHtmlComments(section).trim() === '' ? ['a seção "## Revisão" está vazia'] : [];
}

export function checkPullRequestBody(body: string): readonly string[] {
  return [...reviewProblems(body), ...(GENERATED_FOOTER.test(body) ? ['o corpo do PR não pode ter o rodapé "Generated with"'] : [])];
}
