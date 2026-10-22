export const FORBIDDEN_ENGLISH: readonly RegExp[] = [
  /Cannot read properties/u,
  /is not a function/u,
  /is not a constructor/u,
  /before initialization/u,
  /Maximum call stack/u,
  /Invalid count value/u,
  /toFixed\(\)/u,
  /unsettled/u,
  /Warning/u,
];

export const findForbiddenEnglish = (text: string): readonly string[] => FORBIDDEN_ENGLISH.filter((pattern) => pattern.test(text)).map(String);
