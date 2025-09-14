/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{gs,js,html}",
    "./public/**/*.html",
    "./dist/**/*.{js,html}",
    "./templates/**/*.{gs,html}"
  ],

  theme: {
    extend: {
      colors: {
        // 🇧🇷 Cores Goianas Personalizadas
        'goiano': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Verde principal
          600: '#16a34a',  // Verde escuro
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        'goias-gold': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // Dourado goiano
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        'cerrado': {
          50: '#f7f7f6',
          100: '#e3e3e0',
          200: '#c6c6c1',
          300: '#a4a49e',
          400: '#82827c',
          500: '#6b6b64',  // Cor do cerrado
          600: '#55554f',
          700: '#444441',
          800: '#393936',
          900: '#32322f',
        }
      },

      fontFamily: {
        'goiano': ['Inter', 'system-ui', 'Arial', 'sans-serif'],
        'goiano-mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'goiano-serif': ['Crimson Text', 'Georgia', 'serif'],
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-goiano': 'pulseGoiano 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-goiano': 'bounceGoiano 1s infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        pulseGoiano: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.7' },
        },
        bounceGoiano: {
          '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
        }
      },

      boxShadow: {
        'goiano': '0 4px 6px -1px rgba(34, 197, 94, 0.1), 0 2px 4px -1px rgba(34, 197, 94, 0.06)',
        'goiano-lg': '0 10px 15px -3px rgba(34, 197, 94, 0.1), 0 4px 6px -2px rgba(34, 197, 94, 0.05)',
        'goiano-xl': '0 20px 25px -5px rgba(34, 197, 94, 0.1), 0 10px 10px -5px rgba(34, 197, 94, 0.04)',
      },

      borderRadius: {
        'goiano': '0.75rem',
        'goiano-lg': '1rem',
        'goiano-xl': '1.5rem',
      },

      screens: {
        'xs': '475px',
        '3xl': '1600px',
      }
    },
  },

  plugins: [
    // Plugin personalizado para componentes goianos
    function({ addComponents, theme }) {
      addComponents({
        // Containers Goianos
        '.goiano-container': {
          maxWidth: theme('screens.xl'),
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@screen sm': {
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@screen lg': {
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
        },

        // Cards Goianos
        '.goiano-card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.goiano'),
          boxShadow: theme('boxShadow.goiano'),
          padding: theme('spacing.6'),
          border: `1px solid ${theme('colors.gray.100')}`,
        },

        '.goiano-card-hover': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.goiano'),
          boxShadow: theme('boxShadow.goiano'),
          padding: theme('spacing.6'),
          border: `1px solid ${theme('colors.gray.100')}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme('boxShadow.goiano-lg'),
            transform: 'translateY(-2px)',
          }
        },

        // Botões Goianos
        '.goiano-btn': {
          display: 'inline-flex',
          alignItems: 'center',
          paddingTop: theme('spacing.2'),
          paddingBottom: theme('spacing.2'),
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          border: `1px solid transparent`,
          fontSize: theme('fontSize.sm'),
          fontWeight: theme('fontWeight.medium'),
          borderRadius: theme('borderRadius.md'),
          boxShadow: theme('boxShadow.sm'),
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          textDecoration: 'none',
          '&:focus': {
            outline: 'none',
            ring: '2px',
            ringOffset: '2px',
          }
        },

        '.goiano-btn-primary': {
          color: theme('colors.white'),
          backgroundColor: theme('colors.goiano.600'),
          '&:hover': {
            backgroundColor: theme('colors.goiano.700'),
          },
          '&:focus': {
            ringColor: theme('colors.goiano.500'),
          }
        },

        '.goiano-btn-secondary': {
          color: theme('colors.gray.700'),
          backgroundColor: theme('colors.white'),
          borderColor: theme('colors.gray.300'),
          '&:hover': {
            backgroundColor: theme('colors.gray.50'),
          },
          '&:focus': {
            ringColor: theme('colors.gray.500'),
          }
        },

        '.goiano-btn-success': {
          color: theme('colors.white'),
          backgroundColor: theme('colors.green.600'),
          '&:hover': {
            backgroundColor: theme('colors.green.700'),
          },
        },

        '.goiano-btn-warning': {
          color: theme('colors.white'),
          backgroundColor: theme('colors.goias-gold.500'),
          '&:hover': {
            backgroundColor: theme('colors.goias-gold.600'),
          },
        },

        '.goiano-btn-danger': {
          color: theme('colors.white'),
          backgroundColor: theme('colors.red.600'),
          '&:hover': {
            backgroundColor: theme('colors.red.700'),
          },
        },

        // Inputs Goianos
        '.goiano-input': {
          display: 'block',
          width: '100%',
          paddingTop: theme('spacing.2'),
          paddingBottom: theme('spacing.2'),
          paddingLeft: theme('spacing.3'),
          paddingRight: theme('spacing.3'),
          fontSize: theme('fontSize.sm'),
          lineHeight: theme('lineHeight.5'),
          color: theme('colors.gray.900'),
          backgroundColor: theme('colors.white'),
          backgroundImage: 'none',
          border: `1px solid ${theme('colors.gray.300')}`,
          borderRadius: theme('borderRadius.md'),
          boxShadow: theme('boxShadow.sm'),
          transition: 'all 0.2s ease',
          '&:focus': {
            outline: 'none',
            ring: '2px',
            ringOffset: '2px',
            ringColor: theme('colors.goiano.500'),
            borderColor: theme('colors.goiano.500'),
          }
        },

        // Layout Responsivo Goiano
        '.goiano-grid': {
          display: 'grid',
          gap: theme('spacing.6'),
          '@screen sm': {
            gridTemplateColumns: 'repeat(2, 1fr)',
          },
          '@screen lg': {
            gridTemplateColumns: 'repeat(3, 1fr)',
          },
          '@screen xl': {
            gridTemplateColumns: 'repeat(4, 1fr)',
          },
        },

        // Tipografia Goiana
        '.goiano-heading': {
          fontFamily: theme('fontFamily.goiano'),
          fontWeight: theme('fontWeight.bold'),
          color: theme('colors.gray.900'),
          lineHeight: theme('lineHeight.tight'),
        },

        '.goiano-text': {
          fontFamily: theme('fontFamily.goiano'),
          color: theme('colors.gray.700'),
          lineHeight: theme('lineHeight.relaxed'),
        },

        // Utilitários Goianos
        '.goiano-shadow': {
          boxShadow: theme('boxShadow.goiano'),
        },

        '.goiano-transition': {
          transition: 'all 0.3s ease',
        },

        '.goiano-hover-lift': {
          transition: 'transform 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          }
        }
      })
    }
  ],
}