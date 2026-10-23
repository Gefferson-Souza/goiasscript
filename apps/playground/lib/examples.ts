import { EXAMPLES_BASE_PATH, EXAMPLES_MANIFEST_FILE, EXAMPLE_FILE_PATTERN } from './examples.constants.ts';
import type { ExampleEntry, ExampleFetcher } from './examples.types.ts';

const defaultFetcher: ExampleFetcher = (url) => fetch(url);

function isEntry(value: unknown): value is ExampleEntry {
  if (typeof value !== 'object' || value === null) return false;
  const { id, title, file } = value as Readonly<Record<string, unknown>>;
  return typeof id === 'string' && typeof title === 'string' && typeof file === 'string' && EXAMPLE_FILE_PATTERN.test(file);
}

// Manifest torto não derruba a página: o seletor só fica sem exemplos.
export async function loadExamples(fetcher: ExampleFetcher = defaultFetcher): Promise<readonly ExampleEntry[]> {
  try {
    const response = await fetcher(`${EXAMPLES_BASE_PATH}/${EXAMPLES_MANIFEST_FILE}`);
    const body: unknown = response.ok ? await response.json() : [];
    return Array.isArray(body) && body.every(isEntry) ? body : [];
  } catch {
    return [];
  }
}

export async function loadExampleSource(file: string, fetcher: ExampleFetcher = defaultFetcher): Promise<string | null> {
  if (!EXAMPLE_FILE_PATTERN.test(file)) return null;
  try {
    const response = await fetcher(`${EXAMPLES_BASE_PATH}/${file}`);
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}
