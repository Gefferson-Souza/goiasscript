'use strict';
// Rodar com: node --allow-natives-syntax v8-proto-status.js <plain|goiano>
// Mostra se os protótipos nativos continuam em "fast properties" (modo de objeto rápido do V8) após o runtime.
const { RUNTIME } = require('./harness');
const mode = process.argv[2];
if (mode === 'goiano') (0, eval)(RUNTIME);
const status = {
  mode,
  'Array.prototype fast': %HasFastProperties(Array.prototype),
  'String.prototype fast': %HasFastProperties(String.prototype),
  'Object.prototype fast': %HasFastProperties(Object.prototype),
  'Date.prototype fast': %HasFastProperties(Date.prototype),
  'Object (ctor) fast': %HasFastProperties(Object),
  'ownKeys Array.prototype': Reflect.ownKeys(Array.prototype).length,
  'ownKeys Object.prototype': Reflect.ownKeys(Object.prototype).length,
};
console.log(JSON.stringify(status));
