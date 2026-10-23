import type { Locator, Page } from '@playwright/test';
import { TEXTS } from '../../../playground/components/ui-texts.constants.ts';
import { TEST_IDS } from '../../../playground/lib/test-ids.constants.ts';
import {
  EDITOR_READY_TIMEOUT_MS,
  HOME_PATH,
  HOST_SECRET_KEY,
  HOST_SECRET_VALUE,
  MARKER_SELECTOR,
  MODEL_SETTLE_TIMEOUT_MS,
  MONACO_INPUT_SELECTOR,
} from './playground-page.constants.ts';
import type { OpenOptions, OutputStream } from './playground-page.types.ts';

export class PlaygroundPage {
  readonly #page: Page;
  readonly #canaryRequests: string[] = [];

  constructor(page: Page) {
    this.#page = page;
  }

  // Planta um segredo no localStorage do host para provar que o programa do aluno não o alcança.
  async open(options: OpenOptions = {}): Promise<void> {
    const { canaryUrl } = options;
    if (canaryUrl !== undefined) {
      this.#page.on('request', (request) => {
        if (request.url().startsWith(canaryUrl)) this.#canaryRequests.push(request.url());
      });
    }
    await this.#page.addInitScript(
      ({ key, value }) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {
          return;
        }
      },
      { key: HOST_SECRET_KEY, value: HOST_SECRET_VALUE },
    );
    await this.#page.goto(HOME_PATH);
    await this.#byId(TEST_IDS.editor).waitFor({ timeout: EDITOR_READY_TIMEOUT_MS });
    await this.#page.locator(MONACO_INPUT_SELECTOR).first().waitFor({ state: 'attached', timeout: EDITOR_READY_TIMEOUT_MS });
  }

  // Texto de uma linha entra pelo teclado (sem fechamento automático de parênteses). Várias linhas entram pelo modelo,
  // porque o Monaco reindenta e fecha chaves a cada quebra de linha digitada, mudando o programa.
  async typeProgram(source: string): Promise<void> {
    await this.#byId(TEST_IDS.editor).click();
    if (source.includes('\n')) {
      await this.#replaceModelText(source);
      return;
    }
    await this.#page.keyboard.press('ControlOrMeta+A');
    await this.#page.keyboard.press('Delete');
    await this.#page.keyboard.insertText(source);
    // No WebKit o select-all às vezes sai antes do foco do Monaco e o texto cai no meio do exemplo.
    if (!(await this.#modelSettlesOn(source))) await this.#replaceModelText(source);
  }

  async run(): Promise<void> {
    await this.#byId(TEST_IDS.runButton).click();
  }

  async stop(): Promise<void> {
    await this.#byId(TEST_IDS.stopButton).click();
  }

  async output(): Promise<string> {
    return this.#byId(TEST_IDS.output).innerText();
  }

  async generatedCode(): Promise<string> {
    return this.#byId(TEST_IDS.generatedCode).innerText();
  }

  markers(): Locator {
    return this.#page.locator(MARKER_SELECTOR);
  }

  status(): Locator {
    return this.#page.getByRole('region', { name: TEXTS.outputTitle }).getByRole('status');
  }

  streamLines(stream: OutputStream): Locator {
    return this.#byId(TEST_IDS.output).locator(`[data-stream="${stream}"]`);
  }

  askBox(): Locator {
    return this.#byId(TEST_IDS.askBox);
  }

  outputElements(tagName: string): Locator {
    return this.#byId(TEST_IDS.output).locator(tagName);
  }

  canaryRequests(): readonly string[] {
    return [...this.#canaryRequests];
  }

  async answer(text: string): Promise<void> {
    const input = this.#byId(TEST_IDS.askInput);
    await input.fill(text);
    await input.press('Enter');
  }

  // A digitação chega ao modelo de forma assíncrona; só cai no fallback se o texto não convergir.
  async #modelSettlesOn(source: string): Promise<boolean> {
    try {
      await this.#page.waitForFunction(
        (expected) => {
          const monaco = Reflect.get(window, 'monaco') as { editor: { getModels: () => { getValue: () => string }[] } } | undefined;
          return monaco?.editor.getModels()[0]?.getValue() === expected;
        },
        source,
        { timeout: MODEL_SETTLE_TIMEOUT_MS },
      );
      return true;
    } catch {
      return false;
    }
  }

  async #replaceModelText(source: string): Promise<void> {
    await this.#page.waitForFunction(() => Reflect.has(window, 'monaco'));
    await this.#page.evaluate((text) => {
      type Position = { lineNumber: number; column: number };
      type Model = { setValue: (value: string) => void; getFullModelRange: () => { endLineNumber: number; endColumn: number } };
      const monaco = Reflect.get(window, 'monaco') as {
        editor: { getModels: () => Model[]; getEditors: () => { setPosition: (position: Position) => void }[] };
      };
      const model = monaco.editor.getModels()[0];
      model?.setValue(text);
      const end = model?.getFullModelRange();
      if (end !== undefined) monaco.editor.getEditors()[0]?.setPosition({ lineNumber: end.endLineNumber, column: end.endColumn });
    }, source);
  }

  #byId(id: string): Locator {
    return this.#page.getByTestId(id);
  }
}
