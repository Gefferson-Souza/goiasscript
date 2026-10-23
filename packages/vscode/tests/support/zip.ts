import { inflateRawSync } from 'node:zlib';

const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const CENTRAL_ENTRY = 0x02014b50;
const END_RECORD_MIN_SIZE = 22;
const CENTRAL_ENTRY_SIZE = 46;
const LOCAL_HEADER_SIZE = 30;
const STORED_METHOD = 0;

interface ZipEntry {
  readonly name: string;
  readonly method: number;
  readonly compressedSize: number;
  readonly localOffset: number;
}

function findEndRecord(buffer: Buffer): number {
  for (let position = buffer.length - END_RECORD_MIN_SIZE; position >= 0; position -= 1) {
    if (buffer.readUInt32LE(position) === END_OF_CENTRAL_DIRECTORY) return position;
  }
  throw new Error('arquivo zip sem registro final');
}

function readEntries(buffer: Buffer): readonly ZipEntry[] {
  const end = findEndRecord(buffer);
  const total = buffer.readUInt16LE(end + 10);
  const entries: ZipEntry[] = [];
  let cursor = buffer.readUInt32LE(end + 16);
  for (let index = 0; index < total; index += 1) {
    if (buffer.readUInt32LE(cursor) !== CENTRAL_ENTRY) throw new Error('entrada do diretório central inválida');
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    entries.push({
      name: buffer.toString('utf8', cursor + CENTRAL_ENTRY_SIZE, cursor + CENTRAL_ENTRY_SIZE + nameLength),
      method: buffer.readUInt16LE(cursor + 10),
      compressedSize: buffer.readUInt32LE(cursor + 20),
      localOffset: buffer.readUInt32LE(cursor + 42),
    });
    cursor += CENTRAL_ENTRY_SIZE + nameLength + extraLength + commentLength;
  }
  return entries;
}

export function listZipEntries(zip: Buffer): readonly string[] {
  return readEntries(zip).map((entry) => entry.name);
}

export function readZipEntry(zip: Buffer, name: string): Buffer {
  const entry = readEntries(zip).find((candidate) => candidate.name === name);
  if (entry === undefined) throw new Error(`entrada ausente no zip: ${name}`);
  const nameLength = zip.readUInt16LE(entry.localOffset + 26);
  const extraLength = zip.readUInt16LE(entry.localOffset + 28);
  const start = entry.localOffset + LOCAL_HEADER_SIZE + nameLength + extraLength;
  const data = zip.subarray(start, start + entry.compressedSize);
  return entry.method === STORED_METHOD ? data : inflateRawSync(data);
}
