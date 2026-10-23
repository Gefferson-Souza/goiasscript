import { Fragment } from 'react';
import { INLINE_CODE_FENCE } from '@/lib/cartilha/what-changed.constants';
import { splitPipeTables } from '@/lib/cartilha/what-changed';
import { LessonProse } from './LessonProse';

interface Props {
  readonly markdown: string;
}

// Texto fica texto: só o que está entre crases vira <code>, nada de HTML bruto.
function Cell({ text }: { readonly text: string }) {
  return (
    <>
      {text.split(INLINE_CODE_FENCE).map((piece, index) => (
        <Fragment key={`${String(index)}-${piece}`}>{index % 2 === 1 ? <code>{piece}</code> : piece}</Fragment>
      ))}
    </>
  );
}

export function WhatChanged({ markdown }: Props) {
  return (
    <div className="space-y-4">
      {splitPipeTables(markdown).map((part, partIndex) =>
        part.kind === 'prose' ? (
          <LessonProse key={`prose-${String(partIndex)}`} markdown={part.text} />
        ) : (
          <div key={`table-${String(partIndex)}`} className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {part.header.map((cell) => (
                    <th key={cell}>{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {part.rows.map((row, rowIndex) => (
                  <tr key={`${String(rowIndex)}-${row.join('|')}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${String(cellIndex)}-${cell}`}>
                        <Cell text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      )}
    </div>
  );
}
