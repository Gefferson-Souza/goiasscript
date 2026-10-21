const REVIEW_HEADING = /^##\s+Revisão\s*$/m;
const NEXT_HEADING = /^##\s/m;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const GENERATED_FOOTER = /generated with/i;

function reviewProblems(body: string): readonly string[] {
  const heading = REVIEW_HEADING.exec(body);
  if (heading === null) return ['o corpo do PR precisa da seção "## Revisão"'];
  const section = body.slice(heading.index + heading[0].length).split(NEXT_HEADING)[0] ?? '';
  return section.replace(HTML_COMMENT, '').trim() === '' ? ['a seção "## Revisão" está vazia'] : [];
}

export function checkPullRequestBody(body: string): readonly string[] {
  return [...reviewProblems(body), ...(GENERATED_FOOTER.test(body) ? ['o corpo do PR não pode ter o rodapé "Generated with"'] : [])];
}
