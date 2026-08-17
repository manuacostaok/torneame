# Deploy de Torneame — sin usar la terminal

Pensada para hacerse 100% desde el navegador: GitHub, Neon y Vercel.

## 1. Subir el código a GitHub

Entrá a **github.com/new**, creá un repositorio llamado `torneame` (privado
está bien). Descomprimí el zip del proyecto en tu computadora, y en la
página del repo recién creado usá la opción **"uploading an existing
file"** para arrastrar toda la carpeta descomprimida. GitHub sube todo sin
que necesites instalar git ni abrir una terminal.

## 2. Crear la base de datos en Neon (gratis)

Entrá a **neon.tech**, creá una cuenta gratis y un proyecto nuevo. Te va a
dar un `DATABASE_URL` (empieza con `postgresql://`). Copialo — lo vas a
necesitar en el paso 4.

## 3. Sacar las credenciales de Mercado Pago

Entrá a **developers.mercadopago.com**, creá una aplicación nueva, y andá
a "Credenciales". Para probar todo primero usá las de **TEST** (no las de
producción) — así podés simular pagos sin plata real.

## 4. Importar el proyecto en Vercel

Entrá a **vercel.com**, conectá tu cuenta de GitHub, e importá el
repositorio `torneame`. Antes de darle a Deploy, cargá estas variables de
entorno (Settings → Environment Variables):

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` | Neon (paso 2) |
| `AUTH_SECRET` | Cualquier string largo random |
| `MERCADOPAGO_ACCESS_TOKEN` | Mercado Pago (paso 3, credencial de TEST primero) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Panel de Mercado Pago, al configurar el webhook (paso 6) |
| `APP_URL` | La completás en el paso 5, con la URL que te da Vercel |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Opcional — solo si querés WhatsApp ya andando |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Se generan una vez con `npx web-push generate-vapid-keys` (podés correrlo desde el botón de "Terminal" que trae el propio Vercel, si no tenés terminal local) |

## 5. Deployar y agarrar tu URL pública

Dale a **Deploy**. Vercel instala todo y crea las tablas en tu base de
Neon solo — el build corre `prisma db push` automáticamente, no hace
falta un paso de migración aparte. Te va a dar una URL tipo
`torneame.vercel.app`. Volvé a Environment Variables, completá `APP_URL`
con esa URL real, y hacé un redeploy para que quede sincronizado.

## 6. Configurar el webhook de Mercado Pago

En developers.mercadopago.com, dentro de tu aplicación, configurá la URL
de notificaciones apuntando a:

```
https://tu-url.vercel.app/api/webhooks/mercadopago
```

## 7. Probar el flujo completo

Entrá a tu URL de Vercel, creá una cuenta de organizador, armá un torneo
de prueba, e inscribite con otra cuenta usando las credenciales de TEST
de Mercado Pago. Cuando todo funcione bien, recién ahí cambiás las
credenciales de Mercado Pago de test a las de producción.

## 8. Activar la CSP en modo bloqueante (opcional, después de probar)

El proyecto trae una política de seguridad de contenido (CSP) en modo
`Report-Only` — no bloquea nada todavía, porque nunca pude levantar la
app real en este entorno para confirmar que no rompe la hidratación de
Next.js. Para activarla en serio:

1. Con la app ya en producción, abrí la consola del navegador (F12) en
   varias pantallas distintas (landing, login, torneo, dashboard) y
   fijate si aparece algún warning que empiece con "Content-Security-
   Policy" o "Refused to...".
2. Si no aparece nada en una semana de uso normal, andá a
   `next.config.js` y cambiá la key `Content-Security-Policy-Report-Only`
   por `Content-Security-Policy` (sacale el "-Report-Only"). Ahí sí
   empieza a bloquear de verdad lo que no esté permitido.
3. Si aparece algún warning, agregá el dominio que falta a la directiva
   correspondiente en `cspDirectives` antes de activarla en modo
   bloqueante.

## Notas de seguridad para el deploy real

- **Nunca** subas el archivo `.env` real a GitHub — solo el `.env.example`
  (sin valores) va en el repo. Las variables reales se cargan directo en
  Vercel.
- Cuando pases de credenciales de TEST a las de producción de Mercado
  Pago, generá también un `MERCADOPAGO_WEBHOOK_SECRET` nuevo para
  producción — no reuses el de test.
- `AUTH_SECRET` tiene que ser distinto entre tu entorno de test/preview y
  el de producción.
