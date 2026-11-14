// Íconos SVG propios (trazo, currentColor) para reemplazar emojis: un emoji
// se ve distinto en cada sistema operativo y no respeta la paleta de la app.
const PATHS = {
  sparkles: (
    <>
      <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7.5 2 7.5H4S6 15 6 9z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  crown: <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" />,
  trophy: (
    <>
      <path d="M8 4h8v6a4 4 0 0 1-8 0V4z" />
      <path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4" />
      <path d="M12 14v4M8 20h8" />
    </>
  ),
  joystick: (
    <>
      <circle cx="12" cy="6" r="2.5" />
      <path d="M12 8.5V14" />
      <path d="M5 17a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2z" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`inline-block flex-shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
