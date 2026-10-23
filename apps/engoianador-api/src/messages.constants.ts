export const MESSAGES = {
  invalidJson: 'JSON inválido, ô rapaz',
  invalidBody: 'O corpo tem que ser um objeto { "text": "..." } com um texto de verdade, ô rapaz',
  unsupportedMediaType: 'Manda o corpo como JSON, com Content-Type application/json, sô',
  lengthRequired: 'Faltou o Content-Length, sô. Manda o tamanho do corpo',
  invalidLength: 'Esse Content-Length não presta, ô rapaz',
  bodyTooLarge: 'Esse corpo é grande demais, sô',
  notFound: 'Cabôu o caminho, sô. Tenta POST /engoiana',
  forbiddenOrigin: 'Essa origem num tem licença aqui, sô',
  recess: 'Ô rapaz, o engoianador tá de recesso (config). Volta já já.',
  killSwitch: 'O engoianador tá de folga por enquanto, sô. Volta mais tarde.',
  dailyCap: 'Hoje o engoianador já deu o que tinha, sô. Volta amanhã.',
  rateLimited: 'Calma aí, sô! Ocê já engoianou demais hoje. Volta amanhã.',
  tooFast: 'Devagar, sô! Ocê tá mandando trem demais de uma vez. Espera um tiquinho.',
  providerFailed: 'Ô rapaz! Deu ruim no engoianador. Tenta de novo daqui a pouco.',
  internal: 'Eita, deu um trem estranho aqui dentro. Tenta de novo daqui a pouco, sô.',
} as const;

export function inputTooLongMessage(maxChars: number): string {
  return `Cabôu o limite: ${String(maxChars)} caracteres, sô`;
}
