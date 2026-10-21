import { describe, expect, it } from 'vitest';
import { checkPullRequestBody } from '../../../scripts/pr-body.ts';

describe('corpo do PR', () => {
  it('aceita seção Revisão preenchida', () => { expect(checkPullRequestBody('## Resumo\nx\n\n## Revisão\nAchado A: corrigido.\n\n## Teste\ny')).toEqual([]); });
  it('barra seção ausente, vazia ou só com comentário', () => {
    expect(checkPullRequestBody('## Resumo\nx')).toEqual(['o corpo do PR precisa da seção "## Revisão"']);
    expect(checkPullRequestBody('## Revisão\n\n## Teste')).toEqual(['a seção "## Revisão" está vazia']);
    expect(checkPullRequestBody('## Revisão\n<!-- cole aqui -->\n')).toEqual(['a seção "## Revisão" está vazia']);
  });
  it('barra o rodapé Generated with', () => { expect(checkPullRequestBody('## Revisão\nok\n\nGenerated with algo')).toEqual(['o corpo do PR não pode ter o rodapé "Generated with"']); });
});
