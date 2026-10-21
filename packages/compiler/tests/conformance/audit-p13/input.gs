const xs = [{ n: 3 }, { n: 1 }];
xs.sort((a, b) => a.n - b.n);
console.log(xs[0].n, xs.find(x => x.n === 3).n);