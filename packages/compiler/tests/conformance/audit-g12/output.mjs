class Contador {
  constructor() { this.n = 0; }
  inc() { this.n = this.n + 1; return this; }
}
console.log(new Contador().inc().inc().n);