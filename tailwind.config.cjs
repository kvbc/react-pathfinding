/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            transitionProperty: {
                'bg-color': 'background-color'
            },
            animation: {
                'shake': 'shake 0.5s',
                'fly-in': 'fly-in 0.99s',
                'fly-out': 'fly-out 0.99s',

                'slow-spin': 'slow-spin 5s linear infinite',

                'bounce-1': 'bounce-1 0.5s infinite',
                'bounce-2': 'bounce-2 0.5s infinite',
                'bounce-3': 'bounce-3 0.5s infinite',

                'move-from-nw': 'move-from-nw 0.9s',
                'move-from-n' : 'move-from-n  0.9s',
                'move-from-ne': 'move-from-ne 0.9s',
                'move-from-w' : 'move-from-w  0.9s',
                'move-from-e' : 'move-from-e  0.9s',
                'move-from-sw': 'move-from-sw 0.9s',
                'move-from-s' : 'move-from-s  0.9s',
                'move-from-se': 'move-from-se 0.9s'
            },
            keyframes: {
                'shake': {
                    '0%, 100%': {
                        rotate: '0',
                        transform: 'scale(1)'
                    },
                    '15%': {
                        rotate: '15deg'
                    },
                    '50%': {
                        transform: 'scale(1.15)'
                    },
                    '75%': {
                        rotate: '-15deg',
                    }
                },

                'slow-spin': {
                    '0%': {
                        rotate: '0deg'
                    },
                    '100%': {
                        rotate: '360deg'
                    }
                },

                'fly-in': {
                    '0%': {
                        transform: 'translateX(-100%) translateY(100%)'
                    },
                    '100%': {
                        transform: 'none'
                    }
                },
                'fly-out': {
                    '0%': {
                        transform: 'none'
                    },
                    '100%': {
                        transform: 'translateX(-100%) translateY(100%)'
                    }
                },

                'bounce-1': {
                    '0%, 100%': {
                        transform: 'translateY(0)'
                    },
                    '25%': {
                        transform: 'translateY(-100%)'
                    }
                },
                'bounce-2': {
                    '0%, 100%': {
                        transform: 'translateY(0)'
                    },
                    '50%': {
                        transform: 'translateY(-100%)'
                    }
                },
                'bounce-3': {
                    '0%, 100%': {
                        transform: 'translateY(0)'
                    },
                    '75%': {
                        transform: 'translateY(-100%)'
                    }
                },

                'move-from-nw': {
                    from: { transform: 'translateX(-100%) translateY(-100%)' },
                    to:   { transform: 'none' }
                },
                'move-from-n': {
                    from: { transform: 'translateY(-100%)' },
                    to:   { transform: 'none' }
                },
                'move-from-ne': {
                    from: { transform: 'translateX(100%) translateY(-100%)' },
                    to:   { transform: 'none' }
                },
                'move-from-w': {
                    from: { transform: 'translateX(-100%)' },
                    to:   { transform: 'none' }
                },
                'move-from-e': {
                    from: { transform: 'translateX(100%)' },
                    to:   { transform: 'none' }
                },
                'move-from-sw': {
                    from: { transform: 'translateX(-100%) translateY(100%)' },
                    to:   { transform: 'none' }
                },
                'move-from-s': {
                    from: { transform: 'translateY(100%)' },
                    to:   { transform: 'none' }
                },
                'move-from-se': {
                    from: { transform: 'translateX(100%) translateY(100%)' },
                    to:   { transform: 'none' }
                },
            }
        },
    },
    plugins: [],
}