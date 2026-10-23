import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export function sha256OfFile(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export function matchesSha256(file: string, expected: string): boolean {
  const wanted = expected.trim().toLowerCase();
  return wanted !== '' && sha256OfFile(file) === wanted;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [file, expected] = process.argv.slice(2);
  if (file === undefined) {
    process.stderr.write('Ô rapaz! Faltou dizer qual arquivo conferir.\n');
    process.exit(1);
  }
  if (expected === undefined) {
    process.stdout.write(`sha256=${sha256OfFile(file)}\n`);
  } else if (!matchesSha256(file, expected)) {
    process.stderr.write(`Eita! O sha256 de ${file} não bate com o do job que empacotou.\n`);
    process.exit(1);
  }
}
