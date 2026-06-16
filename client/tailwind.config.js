/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mapping our new global CSS theme variables
        canvasBg: 'var(--color-canvas-bg)',
        cardBg: 'var(--color-card-bg)',
        brandPrimary: 'var(--color-brand-primary)',
        textMain: 'var(--color-text-main)',
        borderMuted: 'var(--color-border-muted)',
      },
    },
  },
  plugins: [],
}