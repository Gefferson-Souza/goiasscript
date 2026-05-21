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

  // Autoload do exemplo básico na primeira renderização cliente, se disponível.
  useEffect(() => {
    fetch('/examples/exemplo.gs')
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-2 p-2 min-h-0">
        <div className="border border-goias-borda rounded-md overflow-hidden min-h-[400px]">
          <Editor value={code} onChange={setCode} />
        </div>
        <div className="min-h-[400px]">
          <OutputPanel outcome={outcome} />
        </div>
      </div>
    </div>
  );
}
