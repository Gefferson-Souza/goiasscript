'use client';
import { Editor as MonacoEditor, loader, type OnMount } from '@monaco-editor/react';
import { GOIAS_LANGUAGE_ID, registerGoiasScript } from '@/lib/monaco-goias';

// Self-host: carrega o Monaco do próprio domínio (/vs), não de CDN externo.
// Necessário porque a CSP do site é script-src 'self' (sem CDN).
loader.config({ paths: { vs: '/vs' } });

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function Editor({ value, onChange }: Props) {
  const handleMount: OnMount = (_editor, monaco) => {
    registerGoiasScript(monaco);
  };

  return (
    <MonacoEditor
      height="100%"
      language={GOIAS_LANGUAGE_ID}
      theme="goias-dark"
      value={value}
      onChange={v => onChange(v ?? '')}
      onMount={handleMount}
      beforeMount={monaco => registerGoiasScript(monaco)}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        automaticLayout: true,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
      }}
    />
  );
}
