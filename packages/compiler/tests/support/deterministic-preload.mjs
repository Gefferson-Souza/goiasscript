const FIXED_TIME = Date.UTC(2026, 0, 15, 12, 0, 0);
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;
const LCG_MODULUS = 4294967296;
let seed = 123456789;

Math.random = () => {
  seed = (seed * LCG_MULTIPLIER + LCG_INCREMENT) % LCG_MODULUS;
  return seed / LCG_MODULUS;
};

const RealDate = Date;
globalThis.Date = class extends RealDate {
  constructor(...args) {
    super(...(args.length === 0 ? [FIXED_TIME] : args));
  }

  static now() {
    return FIXED_TIME;
  }
};
