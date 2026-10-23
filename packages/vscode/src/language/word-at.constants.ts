const ACCENTED_LETTERS = 'áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ';
const COMBINING_MARKS = '\\p{M}';

// Mesmo alfabeto de identificadores do compilador, mais as marcas combinantes (acento decomposto).
export const IDENTIFIER_START_CLASS = `A-Za-z_${ACCENTED_LETTERS}`;
export const IDENTIFIER_PART_CLASS = `${IDENTIFIER_START_CLASS}0-9${COMBINING_MARKS}`;
export const IDENTIFIER_PART = new RegExp(`[${IDENTIFIER_PART_CLASS}]`, 'u');
export const IDENTIFIER_START = new RegExp(`^[${IDENTIFIER_START_CLASS}]`, 'u');
