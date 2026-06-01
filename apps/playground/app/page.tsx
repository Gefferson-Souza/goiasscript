'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Toolbar } from '@/components/Toolbar';
import { OutputPanel } from '@/components/OutputPanel';
import { useRunner } from '@/lib/use-runner';

const Editor = dynamic(() => import('@/components/Editor').then(m => m.Editor), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-goias-texto/60">
      Carregando o editor, sô...
    </div>
  ),
});

const STARTER = `// Bem-vindo ao playground do GoiásScript!
// Escreva goianês raiz e clica em "Bota pra moer" pra ver rodando.

uai saudacao é "Bão demais da conta!";
prosa(saudacao);

uai listaDeNomes é ["João", "Maria", "Zé"];

vai_indo (uai nome de listaDeNomes) {
  prosa("Oi, " mais nome mais "!");
}
`;

export default function PlaygroundPage() {
  const [code, setCode] = useState(STARTER);
  const { outcome, run } = useRunner();

  // Autoload do exemplo "Olá Mundo" na primeira renderização cliente.
  useEffect(() => {
    fetch('/examples/ola-mundo.gs')
      .then(r => (r.ok ? r.text() : null))
      .then(text => {
        if (text && text.trim()) setCode(text);
      })
      .catch(() => {
        /* mantém o STARTER */
      });
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Toolbar
        running={outcome.kind === 'running'}
        onRun={() => run(code)}
        onClear={() => setCode('')}
        onLoadExample={code => setCode(code)}
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 lg:grid-cols-2">
        <div className="h-[55vh] overflow-hidden rounded-md border border-goias-borda lg:h-auto lg:min-h-[400px]">
          <Editor value={code} onChange={setCode} />
        </div>
        <div className="h-[45vh] lg:h-auto lg:min-h-[400px]">
          <OutputPanel outcome={outcome} />
        </div>
      </div>
    </div>
  );
}
