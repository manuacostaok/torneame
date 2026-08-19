/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // Separado en backgroundColor/textColor/borderColor (en vez de un
      // solo objeto "colors") a propósito: "accent" necesita un valor
      // distinto según si se usa de fondo/borde (el violeta saturado,
      // --accent) o de texto (--text-accent, más claro — el violeta
      // saturado como color de texto sobre fondo oscuro pierde legibilidad).
      backgroundColor: {
        // Estos dos usan el patrón rgb(var / <alpha-value>) en vez de
        // "var(--primary)" directo, específicamente porque se usan con
        // el modificador de opacidad de Tailwind (bg-primary/10,
        // bg-accent/30) en FriendTournamentForm.tsx y AnimatedBackground.tsx
        // — con un color hexadecimal plano ese modificador no funciona.
        primary: "rgb(var(--primary-rgb) / <alpha-value>)",
        accent: "rgb(var(--primary-rgb) / <alpha-value>)",
        "surface-0": "var(--surface-0)",
        "surface-1": "var(--surface-1)",
        "surface-2": "var(--surface-2)",
        danger: "var(--bg-danger)",
        success: "var(--bg-success)",
        warning: "var(--bg-warning)",
      },
      textColor: {
        accent: "var(--text-accent)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        danger: "var(--text-danger)",
        success: "var(--text-success)",
        warning: "var(--text-warning)",
      },
      borderColor: {
        primary: "var(--primary)",
        accent: "var(--accent)",
        strong: "var(--border-strong)",
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        pixel: ["var(--font-pixel)"],
      },
      // El fondo animado (AnimatedBackground.tsx) referencia estas dos
      // clases desde el primer día, pero como este archivo no existía
      // nunca se generó el CSS real — la animación estaba "escrita" pero
      // nunca corría.
      keyframes: {
        "float-1": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(20px, 25px)" },
        },
        "float-2": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-25px, -15px)" },
        },
      },
      animation: {
        "float-1": "float-1 9s ease-in-out infinite",
        "float-2": "float-2 11s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
