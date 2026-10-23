'use client';
import { useRef, useState } from 'react';
import { downloadDataUrl, nodeToPng, openTwitterIntent } from '@/lib/share-image';
import { MAX_INPUT_CHARS } from '../../lib/engoianador-client.constants.ts';
import { engoianar } from '../../lib/engoianador-client.ts';
import { FAILURE_MESSAGES } from '../../lib/engoianador-messages.constants.ts';
import { COPIED_FEEDBACK_MS, SHARE_FAILURE_MESSAGE, SHARE_FILE_NAME, SHARE_TEXT } from './engoianador.constants.ts';

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function shareCard(node: HTMLElement): Promise<boolean> {
  try {
    downloadDataUrl(await nodeToPng(node), SHARE_FILE_NAME);
    openTwitterIntent(SHARE_TEXT);
    return true;
  } catch {
    return false;
  }
}

export function useEngoianadorSession(engoianadorUrl: string) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  async function run(text: string) {
    setErrorMessage(null);
    setOutput('');
    setLoading(true);
    const result = await engoianar(text, { baseUrl: engoianadorUrl });
    if (result.ok) setOutput(result.text);
    else setErrorMessage(FAILURE_MESSAGES[result.reason]);
    setLoading(false);
  }

  async function copy() {
    if (output === '' || !(await writeClipboard(output))) return;
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, COPIED_FEEDBACK_MS);
  }

  async function share() {
    if (output === '' || cardRef.current === null) return;
    setSharing(true);
    if (!(await shareCard(cardRef.current))) setErrorMessage(SHARE_FAILURE_MESSAGE);
    setSharing(false);
  }

  const limitInput = (value: string) => {
    setInput(value.slice(0, MAX_INPUT_CHARS));
  };

  return { input, output, errorMessage, loading, copied, sharing, cardRef, setInput: limitInput, run, copy, share };
}
