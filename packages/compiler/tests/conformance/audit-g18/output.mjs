class B {
  constructor() { this.v = [7]; }
  p() { return this["v"][0]; }
}
console.log(new B().p());