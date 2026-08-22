/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Pure monochromatic scale: Black, White, Gray
        black: '#000000',
        white: '#ffffff',
        background: '#09090b',       // Deep matte black (zinc-950)
        surface: {
          DEFAULT: '#121215',        // Dark charcoal (zinc-900)
          secondary: '#18181b',      // Elevated surface (zinc-900)
          tertiary: '#27272a',       // Gutter / active container (zinc-800)
          hover: '#27272a',          // Hover state
        },
        border: {
          DEFAULT: '#27272a',        // zinc-800
          light: '#3f3f46',          // zinc-700
          highlight: '#52525b',      // zinc-600
        },
        muted: '#71717a',            // zinc-500
        subtle: '#a1a1aa',           // zinc-400
        foreground: '#f4f4f5',       // zinc-100
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SF Mono', 'Menlo', 'monospace']
      },
      boxShadow: {
        'panel': '0 8px 30px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
        'elevated': '0 4px 20px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
