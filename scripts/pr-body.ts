const REVIEW_HEADING = /^##\s+Revisão\s*$/m;
const NEXT_HEADING = /^##\s/m;
const HTML_COMMENT = /<!--(?:-?>|[\s\S]*?-->)/g;
const GENERATED_FOOTER = /generated with/i;

// Uma única passada pode juntar as pontas de dois pedaços num comentário novo; repete até estabilizar.
function stripHtmlComments(text: string): string {
  const stripped = text.replace(HTML_COMMENT, '');
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
