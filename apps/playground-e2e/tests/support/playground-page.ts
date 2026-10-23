import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { TEXTS } from '../../../playground/components/ui-texts.constants.ts';
import { TEST_IDS } from '../../../playground/lib/test-ids.constants.ts';
import {
  EDITOR_READY_TIMEOUT_MS,
  HOME_PATH,
  HOST_SECRET_KEY,
  HOST_SECRET_VALUE,
  MARKER_SELECTOR,
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
    // No WebKit o clique pode chegar antes do foco do Monaco, e o select-all cairia fora do editor.
    await expect(this.#page.locator(MONACO_INPUT_SELECTOR).first()).toBeFocused();
    await this.#page.keyboard.press('ControlOrMeta+A');
    await this.#page.keyboard.press('Delete');
    await this.#page.keyboard.insertText(source);
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

  async #replaceModelText(source: string): Promise<void> {
    await this.#page.waitForFunction(() => Reflect.has(window, 'monaco'));
    await this.#page.evaluate((text) => {
      const monaco = Reflect.get(window, 'monaco') as { editor: { getModels: () => { setValue: (value: string) => void }[] } };
      monaco.editor.getModels()[0]?.setValue(text);
    }, source);
  }

  #byId(id: string): Locator {
    return this.#page.getByTestId(id);
  }
}
