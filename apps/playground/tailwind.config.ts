import type { Config } from 'tailwindcss';
import { COLORS, FONT_VARIABLES, MOTION } from './lib/design/design-tokens.constants';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: COLORS,
      fontFamily: {
        sans: [`var(${FONT_VARIABLES.ui})`, 'system-ui', 'sans-serif'],
        mono: [`var(${FONT_VARIABLES.code})`, 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: {
        settle: MOTION.curves.settle,
        travel: MOTION.curves.travel,
        leave: MOTION.curves.leave,
      },
      transitionDuration: {
        enter: `${MOTION.enterMs}ms`,
        exit: `${MOTION.exitMs}ms`,
        caret: `${MOTION.caretTravelMs}ms`,
        swap: `${MOTION.swapMs}ms`,
      },
    },
  },
  plugins: [],
};

export default config;
