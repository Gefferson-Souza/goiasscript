function* g() { yield 1; yield 2; }
console.log([...g()]);