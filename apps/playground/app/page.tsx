'use client';
import dynamic from 'next/dynamic';
import { GeneratedPanel } from '@/components/GeneratedPanel';
import { OutputPanel } from '@/components/OutputPanel';
import { Toolbar } from '@/components/Toolbar';
import { TEXTS } from '@/components/ui-texts.constants';
import { usePlayground } from './use-playground';

const Editor = dynamic(() => import('@/components/Editor').then((module) => module.Editor), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-goias-texto/60">{TEXTS.loadingEditor}</div>,
});

export default function PlaygroundPage() {
  const playground = usePlayground();

  return (
    <div className="flex flex-1 flex-col">
      <Toolbar
        running={playground.running}
        examples={playground.examples}
        shareMessage={playground.shareMessage}
        onRun={() => void playground.run()}
        onStop={playground.stop}
        onClear={playground.clear}
        onShare={() => void playground.share()}
        onPickExample={(id) => void playground.pickExample(id)}
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 lg:grid-cols-2">
        <div className="h-[55vh] overflow-hidden rounded-md border border-goias-borda lg:h-auto lg:min-h-[400px]">
          <Editor value={playground.source} markers={playground.markers} onChange={playground.edit} />
        </div>
        <div className="grid min-h-0 grid-rows-2 gap-2 lg:min-h-[400px]">
          <GeneratedPanel
            code={playground.generatedCode}
            hiddenMarkerCount={playground.hiddenMarkerCount}
            target={playground.target}
            onTargetChange={playground.setTarget}
          />
          <OutputPanel view={playground.runView} onAnswer={playground.answer} />
        </div>
      </div>
    </div>
  );
}
