// Rodar com: node --allow-natives-syntax delete-fast-props.cjs
const lit = { x: 1, y: 2, z: 3 }; delete lit.z;
console.log('literal, delete do último adicionado  -> propriedades rápidas:', %HasFastProperties(lit));
const asg = {}; asg.x = 1; asg.y = 2; asg.z = 3; delete asg.z;
console.log('atribuído, delete do último adicionado -> propriedades rápidas:', %HasFastProperties(asg));
const asg2 = {}; asg2.x = 1; asg2.y = 2; asg2.z = 3; delete asg2.x;
console.log('atribuído, delete do primeiro          -> propriedades rápidas:', %HasFastProperties(asg2));
class P { constructor() { this.a = 1; this.b = 2; this.c = 3; } }
const p = new P(); delete p.c;
console.log('instância de classe, delete do último  -> propriedades rápidas:', %HasFastProperties(p));
const q = new P(); q.c = undefined;
console.log('instância de classe, atribuir undefined -> propriedades rápidas:', %HasFastProperties(q));
