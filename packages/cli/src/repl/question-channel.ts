import type { CliIo } from '../io.types.ts';
import type { AskingChannel, PendingQuestion } from './host-context.types.ts';
import { QUESTION_SEPARATOR } from './repl.constants.ts';

export function createQuestionChannel(io: Pick<CliIo, 'out'>, createEndError: () => Error): AskingChannel {
  let queue: readonly PendingQuestion[] = [];
  let ended = false;
  const announceHead = (): void => {
    const [head] = queue;
    if (head !== undefined) io.out.write(`${head.prompt}${QUESTION_SEPARATOR}`);
  };
  return {
    ask(prompt) {
      if (ended) return Promise.reject(createEndError());
      return new Promise<string>((resolve, reject) => {
        queue = [...queue, { prompt, resolve, reject }];
        if (queue.length === 1) announceHead();
      });
    },
    hasPending: () => queue.length > 0,
    answer(line) {
      const [current, ...rest] = queue;
      queue = rest;
      current?.resolve(line);
      announceHead();
    },
    discard() {
      queue = [];
    },
    end() {
      ended = true;
      const rejected = queue;
      queue = [];
      rejected.forEach((question) => {
        question.reject(createEndError());
      });
    },
  };
}
