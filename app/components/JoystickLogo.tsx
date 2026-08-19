"use client";

// Silueta genérica de control de dos grips (tipo el clásico de PS2), en un
// solo trazo continuo para el efecto de "se dibuja solo". Los detalles
// (cruceta, botones, joysticks) son elementos aparte que aparecen con un
// fade una vez que el contorno terminó de dibujarse — así el ícono se ve
// rico sin depender de un solo path imposible de mantener.
//
// Nota de diseño: esta es una aproximación funcional para tener el efecto
// de dibujado andando ya. Antes de producción conviene que un diseñador
// re-trace la silueta en Figma/Illustrator con proporciones más precisas
// (sin copiar el diseño protegido de ningún fabricante puntual — esto es
// una silueta genérica de "control de dos grips", no el logo de nadie).

const OUTLINE_LENGTH = 380;

  export function JoystickLogo({
    progress = 0,
    size = 40,
    className = "",
    style,
  }: {
    progress?: number;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
  }) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const dashoffset = OUTLINE_LENGTH * (1 - clamped);
  const detailsOpacity = clamped > 0.75 ? (clamped - 0.75) / 0.25 : 0;

  return (
    <svg
      width={size}
      height={(size * 100) / 160}
      viewBox="0 0 160 100"
      fill="none"
      className={className}
      role="img"
      aria-label="Torneame"
      style={style}
    >
      <path
        d="M 30 24
           Q 15 24 12 40
           Q 9 58 22 66
           Q 33 72 40 62
           L 50 50
           L 110 50
           L 120 62
           Q 127 72 138 66
           Q 151 58 148 40
           Q 145 24 130 24
           Z"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={OUTLINE_LENGTH}
        strokeDashoffset={dashoffset}
        style={{ transition: "stroke-dashoffset 0.12s linear" }}
      />

      <g style={{ opacity: detailsOpacity, transition: "opacity 0.3s ease" }}>
        <path
          d="M 38 30 L 38 40 M 33 35 L 43 35"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx="122" cy="30" r="2.6" fill="currentColor" />
        <circle cx="130" cy="35" r="2.6" fill="currentColor" />
        <circle cx="122" cy="40" r="2.6" fill="currentColor" />
        <circle cx="114" cy="35" r="2.6" fill="currentColor" />
        <circle cx="66" cy="42" r="7" stroke="currentColor" strokeWidth={3} />
        <circle cx="94" cy="42" r="7" stroke="currentColor" strokeWidth={3} />
      </g>
    </svg>
  );
}

export const JOYSTICK_PATH_LENGTH = OUTLINE_LENGTH;
