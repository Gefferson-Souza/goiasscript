const { a, ...resto } = { a: 1, b: 2, c: 3 };
console.log(a, resto, [..."abc"].length);