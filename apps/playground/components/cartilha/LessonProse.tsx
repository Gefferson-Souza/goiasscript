import Markdown, { type Components } from 'react-markdown';
import { isSafeLessonHref } from '@/lib/cartilha/markdown-urls';

interface Props {
  readonly markdown: string;
}

// Nada de HTML bruto, imagem nem link fora do https ou do caminho interno: o texto fica, o perigo cai fora.
const COMPONENTS: Components = {
  a: ({ href, children }) =>
    href !== undefined && isSafeLessonHref(href) ? (
      <a href={href} rel="noopener noreferrer" className="text-goias-amarelo underline">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  img: () => null,
};

// Sem plugin de HTML bruto e sem innerHTML: o Markdown vira árvore React.
export function LessonProse({ markdown }: Props) {
  return (
    <div className="lesson-prose space-y-4 leading-relaxed">
      <Markdown skipHtml components={COMPONENTS} urlTransform={(url) => (isSafeLessonHref(url) ? url : '')}>
        {markdown}
      </Markdown>
    </div>
  );
}
