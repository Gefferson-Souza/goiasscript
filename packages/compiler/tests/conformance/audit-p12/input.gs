function f() { return Array.prototype.slice.call(arguments).length; }
console.log(f(1, 2, 3));