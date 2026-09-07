# TODOS

## Acotar la query del dashboard de organizador

**What:** `app/organizador/dashboard/page.tsx` trae *todos* los torneos del
organizador con *todas* sus inscripciones y pagos anidados
(`tournaments: { include: { registrations: { include: { payment: true } } } }`),
sin `take` ni filtro de fecha.

**Why:** con pocos torneos no se nota. El día que un organizador acumule
muchos torneos históricos con cientos de inscriptos cada uno, esa query va a
crecer sin techo cada vez que abra su dashboard — y ese tipo de deuda se
olvida hasta que el dashboard tarda varios segundos en cargar.

**Pros:** evita una degradación de performance silenciosa; el cambio en sí
es chico (agregar `take` y/o un filtro por fecha a la query).

**Cons:** el criterio de corte (¿últimos N torneos? ¿últimos 12 meses?
¿separar "activos" de "históricos" en dos queries?) es una decisión de
producto, no solo técnica — no hay todavía datos reales de cuántos torneos
por organizador es típico en la plataforma.

**Context:** encontrado durante la auditoría de arquitectura del
2026-09-06/07 (sección Performance de `/plan-eng-review`). Ver
`app/organizador/dashboard/page.tsx:14-25`.

**Depends on / blocked by:** nada — se puede hacer en cualquier momento,
pero conviene esperar a tener una noción real de la distribución de
torneos-por-organizador antes de elegir el corte.
