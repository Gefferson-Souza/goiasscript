async function f() { return await Promise.resolve(7); }
f().then(v => console.log("async", v));