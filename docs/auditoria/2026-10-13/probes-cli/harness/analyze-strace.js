'use strict';
// Lê um log do strace e resume: escritas (open com flag de escrita, mkdir, unlink, rename...)
// fora do cwd esperado, execve de processos filhos e conexões de rede.
const fs = require('fs');
const path = require('path');

const [, , logFile, cwdArg, logsDir] = process.argv;
const cwd = fs.realpathSync(cwdArg);
const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);

const IGNORED_PREFIXES = ['/dev/', '/proc/', '/sys/', logsDir, '/tmp/node-compile-cache', path.dirname(logsDir) + '/npm-cache'];
const isIgnored = p => IGNORED_PREFIXES.some(prefix => p.startsWith(prefix));
const inside = p => p === cwd || p.startsWith(cwd + path.sep);

const writes = [];
const unlinks = [];
const execs = [];
const nets = [];

for (const raw of lines) {
  const line = raw.replace(/^\d+\s+/, '');
  let m;
  if ((m = line.match(/^openat\(([^,]+), "([^"]+)", ([^)]*)\)\s+=\s+(-?\d+)/))) {
    const [, , file, flags, ret] = m;
    if (/O_WRONLY|O_RDWR|O_CREAT|O_TRUNC|O_APPEND/.test(flags) && Number(ret) >= 0) {
      const abs = path.resolve(cwd, file);
      if (!isIgnored(abs)) writes.push({ op: 'open-write', abs, inside: inside(abs) });
    }
  } else if ((m = line.match(/^(mkdir|mkdirat)\((?:[^,]+, )?"([^"]+)"/))) {
    const abs = path.resolve(cwd, m[2]);
    if (!isIgnored(abs)) writes.push({ op: 'mkdir', abs, inside: inside(abs) });
  } else if ((m = line.match(/^(unlink|unlinkat)\((?:[^,]+, )?"([^"]+)"[^)]*\)\s+=\s+(-?\d+)/))) {
    const abs = path.resolve(cwd, m[2]);
    if (!isIgnored(abs) && Number(m[3]) >= 0) unlinks.push({ op: 'unlink', abs, inside: inside(abs) });
  } else if ((m = line.match(/^(rename|renameat|renameat2)\((?:[^,]+, )?"([^"]+)", (?:[^,]+, )?"([^"]+)"/))) {
    const abs = path.resolve(cwd, m[3]);
    if (!isIgnored(abs)) writes.push({ op: `rename ${m[2]} ->`, abs, inside: inside(abs) });
  } else if ((m = line.match(/^(rmdir)\("([^"]+)"/))) {
    const abs = path.resolve(cwd, m[2]);
    if (!isIgnored(abs)) unlinks.push({ op: 'rmdir', abs, inside: inside(abs) });
  } else if ((m = line.match(/^execve\("([^"]+)", \[(.*?)\].*\)\s+=\s+0\s*$/))) {
    execs.push({ bin: m[1], argv: m[2].slice(0, 160) });
  } else if ((m = line.match(/^connect\(\d+, \{sa_family=(AF_INET6?), .*?sin6?_port=htons\((\d+)\).*?inet_?(?:pton|addr)?\(?"?([^")]*)"?\)?/))) {
    nets.push(`${m[1]} porta ${m[2]} ${m[3]}`);
  }
}

const uniq = arr => {
  const seen = new Set();
  return arr.filter(x => {
    const k = `${x.op}|${x.abs}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const outsideWrites = uniq(writes).filter(w => !w.inside);
const insideWrites = uniq(writes).filter(w => w.inside);
const outsideUnlinks = uniq(unlinks).filter(w => !w.inside);
const insideUnlinks = uniq(unlinks).filter(w => w.inside);

// o 1o execve é o próprio node/wrapper; os demais são processos filhos
const children = execs.slice(1).filter(e => !/\/strace$/.test(e.bin));

const parts = [];
if (insideWrites.length) parts.push(`escreve em cwd: ${insideWrites.map(w => path.relative(cwd, w.abs) || '.').join(', ')}`);
if (insideUnlinks.length) parts.push(`apaga em cwd: ${insideUnlinks.map(w => path.relative(cwd, w.abs) || '.').join(', ')}`);
if (outsideWrites.length) parts.push(`!! ESCREVE FORA do cwd: ${outsideWrites.map(w => w.op + ' ' + w.abs).join(', ')}`);
if (outsideUnlinks.length) parts.push(`!! APAGA FORA do cwd: ${outsideUnlinks.map(w => w.op + ' ' + w.abs).join(', ')}`);
if (children.length) parts.push(`!! processos filhos: ${children.map(e => e.bin + ' [' + e.argv + ']').join(' ; ')}`);
if (nets.length) parts.push(`!! rede: ${nets.join(', ')}`);
console.log(parts.length ? '  ' + parts.join('\n  ') : '  (sem escrita fora do cwd, sem processo filho, sem rede)');
