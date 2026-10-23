import { expect, type Locator, type Page } from '@playwright/test';
import { TEST_IDS } from '../../../playground/lib/test-ids.constants.ts';
import {
  BLOCKED_STORAGE_SCRIPT,
  PRIMER_DONE_TIMEOUT_MS,
  PRIMER_EDITOR_TIMEOUT_MS,
  PRIMER_MARKER_ATTEMPT_TIMEOUT_MS,
  PRIMER_PATH,
} from './cartilha-page.constants.ts';

export class PrimerPage {
  readonly #page: Page;

  constructor(page: Page) {
    this.#page = page;
  }

  async blockStorage(): Promise<void> {
    await this.#page.addInitScript(BLOCKED_STORAGE_SCRIPT);
  }

  async openIndex(): Promise<void> {
    await this.#page.goto(PRIMER_PATH);
    await this.#byId(TEST_IDS.lessonIndex).waitFor({ timeout: PRIMER_EDITOR_TIMEOUT_MS });
  }

  async openLesson(lessonId: string): Promise<void> {
    await this.#page.goto(`${PRIMER_PATH}/${lessonId}`);
    await this.#byId(TEST_IDS.editor).waitFor({ timeout: PRIMER_EDITOR_TIMEOUT_MS });
    // `monaco` aparece em window antes do editor montar, e o modelo nasce antes de o React ouvir as edições.
    // Dois quadros depois o React já assinou o onChange; um setValue antes disso nunca chega à lição.
    await this.#page.waitForFunction(
      () => {
        const monaco = Reflect.get(window, 'monaco') as { editor: { getModels: () => unknown[] } } | undefined;
        return (monaco?.editor.getModels().length ?? 0) > 0;
      },
      undefined,
      { timeout: PRIMER_EDITOR_TIMEOUT_MS },
    );
    await this.#page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    })));
  }

  async selectExercise(): Promise<void> {
    await this.#byId(TEST_IDS.lessonTabExercise).click();
  }

  // Várias linhas ou não, entra pelo modelo: o Monaco reindenta e fecha parênteses quando o texto é digitado.
  async setProgram(source: string): Promise<void> {
    await this.#page.evaluate((text) => {
      type Model = { setValue: (value: string) => void };
      const monaco = Reflect.get(window, 'monaco') as { editor: { getModels: () => Model[] } };
      monaco.editor.getModels()[0]?.setValue(text);
    }, source);
  }

  // No WebKit o React pode assinar o onChange depois dos dois quadros; refaz a edição até o compilador reagir.
  async setProgramUntil(source: string, compiled: () => Promise<boolean>): Promise<void> {
    await expect(async () => {
      await this.setProgram('');
      await this.setProgram(source);
      await expect.poll(compiled, { timeout: PRIMER_MARKER_ATTEMPT_TIMEOUT_MS }).toBe(true);
    }).toPass({ timeout: PRIMER_EDITOR_TIMEOUT_MS });
  }

  async runExample(): Promise<void> {
    await this.#byId(TEST_IDS.runButton).click();
  }

  async checkExercise(): Promise<void> {
    await this.#byId(TEST_IDS.exerciseCheckButton).click();
  }

  async output(): Promise<string> {
    return this.#byId(TEST_IDS.output).innerText();
  }

  verdict(): Locator {
    return this.#byId(TEST_IDS.exerciseVerdict);
  }

  expectedOutput(): Locator {
    return this.#byId(TEST_IDS.exerciseExpected);
  }

  actualOutput(): Locator {
    return this.#byId(TEST_IDS.exerciseActual);
  }

  doneBadges(): Locator {
    return this.#byId(TEST_IDS.lessonDoneBadge);
  }

  lessonLink(lessonId: string): Locator {
    return this.#page.locator(`[data-testid="${TEST_IDS.lessonLink}"][data-lesson-id="${lessonId}"]`);
  }

  doneTimeoutMs(): number {
    return PRIMER_DONE_TIMEOUT_MS;
  }

  #byId(id: string): Locator {
    return this.#page.getByTestId(id);
  }
}
