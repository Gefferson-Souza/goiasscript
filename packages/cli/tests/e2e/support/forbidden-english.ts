import path from 'node:path';
import { findEnglishHits, loadEnglishRules } from '../../../../../scripts/english-ui.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../../../..');
const FORBIDDEN = loadEnglishRules(ROOT_DIR).forbidden;

export const findForbiddenEnglish = (text: string): readonly string[] => findEnglishHits(text, FORBIDDEN);
