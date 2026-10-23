import type { Locator, Page } from '@playwright/test';
import { TEST_IDS } from '../../../playground/lib/test-ids.constants.ts';
import { BLOCKED_STORAGE_SCRIPT, PRIMER_DONE_TIMEOUT_MS, PRIMER_EDITOR_TIMEOUT_MS, PRIMER_PATH } from './cartilha-page.constants.ts';

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
    await this.#page.waitForFunction(() => Reflect.has(window, 'monaco'), undefined, { timeout: PRIMER_EDITOR_TIMEOUT_MS });
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
