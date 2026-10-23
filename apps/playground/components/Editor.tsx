'use client';
import { Editor as MonacoEditor, loader, type Monaco, type OnMount } from '@monaco-editor/react';
import { useEffect, useRef } from 'react';
import type { EditorMarker } from '@/lib/diagnostic-markers.types';
import { TEST_IDS } from '@/lib/test-ids.constants';
import { applyMarkers } from '@/lib/monaco/apply-markers';
import { EDITOR_UNICODE_HIGHLIGHT, GOIASSCRIPT_LANGUAGE_ID, MONACO_BASE_PATH } from '@/lib/monaco/monaco-assets';
import { registerGoiasScript } from '@/lib/monaco/register-language';
import { EDITOR_LANGUAGE_CONFIGURATION, EDITOR_THEME, EDITOR_THEME_NAME } from '@/lib/monaco/editor-theme.constants';
import { EDITOR_FONT_SIZE, EDITOR_TAB_SIZE } from './editor.constants';

// O Monaco vem do próprio domínio: a CSP do site não aceita CDN.
loader.config({ paths: { vs: MONACO_BASE_PATH } });

interface Props {
  readonly value: string;
  readonly markers: readonly EditorMarker[];
  readonly onChange: (value: string) => void;
}

interface MountedEditor {
  readonly monaco: Monaco;
  readonly model: ReturnType<Monaco['editor']['getModels']>[number];
}

export function Editor({ value, markers, onChange }: Props) {
  const mounted = useRef<MountedEditor | null>(null);

  useEffect(() => {
    const target = mounted.current;
    if (target !== null) applyMarkers(target.monaco.editor, target.monaco.Uri, target.model, markers);
  }, [markers]);

  const handleMount: OnMount = (editor, monaco) => {
    const model = editor.getModel();
    if (model === null) return;
    mounted.current = { monaco, model };
    applyMarkers(monaco.editor, monaco.Uri, model, markers);
  };

  const handleBeforeMount = (monaco: Monaco): void => {
    registerGoiasScript(monaco);
    monaco.languages.setLanguageConfiguration(GOIASSCRIPT_LANGUAGE_ID, EDITOR_LANGUAGE_CONFIGURATION);
    monaco.editor.defineTheme(EDITOR_THEME_NAME, EDITOR_THEME);
  };

  return (
    <div className="h-full" data-testid={TEST_IDS.editor}>
      <MonacoEditor
        height="100%"
        language={GOIASSCRIPT_LANGUAGE_ID}
        theme={EDITOR_THEME_NAME}
        value={value}
        onChange={(next) => onChange(next ?? '')}
        onMount={handleMount}
        beforeMount={handleBeforeMount}
        options={{
          fontSize: EDITOR_FONT_SIZE,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: EDITOR_TAB_SIZE,
          automaticLayout: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          unicodeHighlight: EDITOR_UNICODE_HIGHLIGHT,
        }}
      />
    </div>
  );
}
