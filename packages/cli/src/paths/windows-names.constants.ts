const DEVICE_NUMBERS: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const WINDOWS_RESERVED_NAMES: ReadonlySet<string> = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  'conin$',
  'conout$',
  ...DEVICE_NUMBERS.flatMap((number) => [`com${number}`, `lpt${number}`]),
  'com¹',
  'com²',
  'com³',
  'lpt¹',
  'lpt²',
  'lpt³',
]);
