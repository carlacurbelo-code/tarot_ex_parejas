# Auditoría de portabilidad — Tarot de Medianoche

**Fecha de auditoría:** 25 de agosto de 2026.  
**Alcance:** documentación y preparación de salida; **no se ejecutó ninguna migración, cambio de hosting, rotación de secretos ni reconfiguración de proveedores**.

## Conclusión ejecutiva

La aplicación puede trasladarse a un proveedor compatible con **Node.js/Express**, pero no es hoy independiente de Manus. El núcleo del producto —React, Express, tRPC, Drizzle, MySQL, las tiradas, prompts, reglas y UI— es portable. Sin embargo, la autenticación, el LLM, almacenamiento de audio, notificaciones, analítica y dominio actual usan infraestructura administrada por Manus y requieren adaptadores o sustituciones acotadas antes de una salida.

> **Estado real:** el código está exportado a GitHub y las migraciones de pedidos/configuración están versionadas. No existe integración activa de Supabase ni Dodo, y el dominio activo es un subdominio de Manus; por tanto, esos tres puntos no pueden certificarse como activos bajo una cuenta externa propia todavía.

## Matriz de control y portabilidad

| Requisito | Estado auditado | Evidencia o matiz | Acción previa a una salida |
|---|---|---|---|
| Código fuente en GitHub | **Confirmado técnicamente** | Remoto `user_github` en `main`; repositorio público `carlacurbelo-code/tarot_ex_parejas`. | Mantener acceso de propietaria, 2FA, copia local y protección de rama. |
| Supabase bajo cuenta propia | **No aplicable hoy** | No hay SDK, variables ni referencias a Supabase. La base actual usa Drizzle con dialecto MySQL. | Si se elige Supabase, convertir schema/migraciones a PostgreSQL; no es un reemplazo directo de MySQL. |
| Dodo bajo cuenta propia | **No aplicable hoy** | No existe SDK, clave ni webhook de Dodo. Los pagos actuales son PayPal.me y confirmación por tRPC. | Abrir/usar cuenta Dodo sólo al decidir sustituir PayPal; integrar sus claves y webhook en un bloque separado. |
| Dominio bajo cuenta propia | **Pendiente / no confirmado** | El dominio disponible es `tarotpairs-2bz8spuk.manus.space`, un subdominio administrado por Manus. | Registrar o transferir un dominio propio y conservar acceso al registrador/DNS. |
| Secretos documentados | **Documentado en esta auditoría** | Se agregó `.env.portable.example`, sin valores secretos. | Cargar valores reales en el gestor de secretos del proveedor destino. |
| Migraciones versionadas | **Parcialmente confirmado** | `orders` y `settings` están en `drizzle/0001_cute_exiles.sql`; `users` existe en schema pero no en esa migración. | Generar y revisar una migración de `users` antes de una base vacía externa. |
| Despliegue Node/Express | **Preparado documentalmente** | Scripts de `build`, `start`, `check` y `test` son Node/Vite/esbuild estándar. | Sustituir los adaptadores Manus del cuadro siguiente y desplegar. |
| Callbacks y webhooks | **Requieren sólo configuración/adaptador** | `/api/oauth/callback` es una ruta relativa; no hay webhook Dodo hoy. | Registrar el dominio nuevo en el proveedor OAuth y configurar futuros webhooks mediante variables. |
| Dependencias propietarias sin reemplazo | **Existen, pero están localizadas** | Auth, Forge LLM, Forge Storage, Notification Service, analytics y plugin de Vite. | Aplicar el plan de salida; no exige reescribir el motor del producto. |

## Dependencias propietarias actuales y reemplazo

| Componente actual | Dónde se usa | Dependencia de Manus | Reemplazo portable propuesto | Alcance estimado |
|---|---|---|---|---|
| Manus OAuth | `server/_core/sdk.ts`, `oauth.ts`, `context.ts`, `client/src/const.ts` | Intercambio de código, consulta de usuario y sincronización contra `OAUTH_SERVER_URL`. | Auth0, Clerk, Supabase Auth o OAuth propio; mantener la cookie JWT local y sustituir el adapter. | Medio. Afecta sólo login/admin y callback. |
| Forge LLM | `server/_core/llm.ts` | Llamada a `forge.manus.ai` con `BUILT_IN_FORGE_API_KEY`; modelo fijado en el adapter. | SDK/API directa de Gemini, OpenAI-compatible u otro proveedor mediante `LLM_*`. | Bajo. Una sustitución en el adapter; prompts y rutas quedan intactos. |
| Forge Storage | `server/storage.ts`, `server/_core/storageProxy.ts` | Presign y redirección de `/manus-storage/*` mediante Forge. | Bucket S3, R2, Backblaze B2 u otro S3 compatible; presigned URLs propios. | Medio. Cambiar adapter y migrar archivos de audio existentes. |
| Notificación a propietaria | `server/_core/notification.ts` | Endpoint `WebDevService/SendNotification` con Forge. | Email transaccional, WhatsApp Business, Slack o webhook bajo cuenta propia. | Bajo. Sustituir una función. |
| Analítica Manus | `client/index.html` | Script inyectado desde `VITE_ANALYTICS_ENDPOINT` administrado. | Umami propio/Cloud, Plausible, PostHog o retirar el script. | Bajo y no crítico. |
| Runtime/debug de Manus | `vite.config.ts`, `vite-plugin-manus-runtime`, `__manus__` | Plugin de runtime, collector de logs y allowlist local Manus. | Remover plugin/collector de desarrollo; conservar Vite/React/Tailwind estándar. | Bajo. Desarrollo/build, no lógica de negocio. |
| Hosting y subdominio Manus | Hosting actual y `*.manus.space` | DNS y despliegue administrados por la plataforma. | Cualquier host de Node/Express con dominio y DNS propios. | Bajo una vez sustituidos los adapters. |

El catálogo de 78 cartas, selección sin duplicados, reversas, reglas de contexto, restricciones de salud, prompts, lectura de una/tres cartas, tRPC, React, Express, Drizzle y la lógica PayPal.me son código de aplicación; no dependen de una API propietaria de Manus.

## Variables de entorno

La aplicación usa hoy variables administradas por Manus. La tabla las separa de las necesarias una vez portada.

| Variable actual | Uso | Estado fuera de Manus | Variable/acción objetivo |
|---|---|---|---|
| `DATABASE_URL` | Conexión Drizzle/MySQL. | Reutilizable con una base MySQL compatible. | Mantener `DATABASE_URL` con host propio. |
| `JWT_SECRET` | Firma de sesión. | Reutilizable. | Mantenerla; generar un valor aleatorio y custodiarlo. |
| `VITE_APP_ID` | Identificador Manus OAuth. | Reemplazar. | `AUTH_CLIENT_ID` del proveedor elegido. |
| `OAUTH_SERVER_URL` | API Manus OAuth. | Reemplazar. | `AUTH_ISSUER_URL`/SDK del proveedor. |
| `VITE_OAUTH_PORTAL_URL` | Inicio de sesión Manus desde cliente. | Reemplazar. | URL/SDK de auth alternativo. |
| `OWNER_OPEN_ID` | Asignación de rol admin Manus. | Reemplazar. | `ADMIN_IDENTIFIER` o rol persistido en base propia. |
| `BUILT_IN_FORGE_API_URL` | LLM, storage y notificaciones Forge. | Reemplazar. | Separar en `LLM_BASE_URL`, S3 y webhook de notificación. |
| `BUILT_IN_FORGE_API_KEY` | Credencial Forge. | Reemplazar. | `LLM_API_KEY`, credenciales S3 y webhook propios. |
| `VITE_FRONTEND_FORGE_*` | Variables del cliente administrado; no son requeridas por el flujo público actual. | Eliminar si siguen sin uso. | No incorporar. |
| `VITE_ANALYTICS_ENDPOINT` / `VITE_ANALYTICS_WEBSITE_ID` | Script Umami de la página. | Opcional. | Mantener con servicio propio o eliminar. |
| `PORT`, `NODE_ENV` | Arranque Node. | Reutilizables. | Mantener. |

El archivo [`.env.portable.example`](../.env.portable.example) contiene los nombres objetivo sin secretos. `.env*` y `.project-config.json` están excluidos por `.gitignore`; ninguna clave real se incorporó a este repositorio durante la auditoría.

## Base de datos y archivos

La configuración Drizzle declara dialecto **MySQL** y toma la conexión de `DATABASE_URL`. El SQL versionado crea las tablas `orders` y `settings`. Existe una brecha concreta: `users` forma parte de `drizzle/schema.ts` y de la autenticación, pero no aparece en `0001_cute_exiles.sql`. Antes de declarar la base completamente reproducible desde cero, hay que ejecutar `pnpm drizzle-kit generate`, revisar la migración generada de `users` y versionarla. Esta auditoría **no generó ni aplicó esa migración**.

Los audios premium almacenan una `audioFileKey`, no bytes dentro de la base. Es una buena separación de responsabilidades, pero las claves actuales se resuelven mediante `/manus-storage/*` y Forge. La salida debe incluir un inventario/export de claves, copia de los MP3 a un bucket propio y una estrategia de compatibilidad de URL o redirección hasta que todos los enlaces se actualicen.

## Pagos, Dodo y callbacks

El código actual no usa Dodo. El pago existente se compone de un enlace PayPal.me configurable en `settings`, un campo de ID de transacción y `tarot.confirmPayment`; no hay una verificación automática de PayPal ni webhook de pagos. Por eso no existe un callback de Dodo que migrar.

La ruta OAuth actual es relativa: `/api/oauth/callback`. El cliente construye el redirect a partir de `window.location.origin`, de modo que el dominio nuevo no está hardcodeado en la lógica pública. Al portar habrá que registrar `https://nuevo-dominio/api/oauth/callback` en el proveedor OAuth elegido y reemplazar el adapter Manus; no hay que alterar el motor de lecturas. Para Dodo u otro pago futuro, usar `PAYMENTS_WEBHOOK_SECRET` y una ruta estable como `/api/webhooks/payments`, validando firma y guardando el proveedor detrás de un adapter.

## Plan de salida sin ejecutar migración

### Fase 0 — Control externo

Primero, confirmar acceso administrador a la cuenta GitHub vinculada, registrar un dominio propio bajo un registrador elegido y crear cuentas propias para los servicios que se decida usar. El orden de decisión recomendado es: base de datos MySQL propia **o** conversión deliberada a PostgreSQL/Supabase; proveedor de autenticación; LLM; bucket S3; canal de notificaciones; proveedor de pagos.

### Fase 1 — Preparación de código

Crear interfaces/adapters para `AuthProvider`, `LlmProvider`, `StorageProvider` y `OwnerNotifier`. Mantener los routers tRPC, los prompts, las reglas de tarot y la UI; reemplazar sólo las implementaciones Manus. Remover `vite-plugin-manus-runtime`, el collector de desarrollo y la allowlist de hosts Manus en una rama de migración. Sustituir `OWNER_OPEN_ID` por una regla portable de rol administrativo.

### Fase 2 — Datos y secretos

Crear una base de staging vacía, completar y aplicar las migraciones Drizzle versionadas, y exportar la base actual antes de cualquier corte. Copiar los objetos de audio a un bucket propio manteniendo un mapeo `clave antigua → clave nueva`. Cargar los valores de `.env.portable.example` en el gestor de secretos del proveedor destino; nunca en GitHub.

### Fase 3 — Despliegue de staging

Instalar dependencias con `pnpm install --frozen-lockfile`, ejecutar `pnpm check`, `pnpm test`, `pnpm build` y arrancar con `pnpm start`. Publicar el proceso Node/Express detrás de HTTPS, asignar el nuevo dominio de staging, registrar el callback OAuth y probar lectura gratuita, lectura profunda, administración, subida/descarga de audio, notificación y pago.

### Fase 4 — Corte controlado

Reducir el TTL DNS del dominio propio, congelar escrituras brevemente, ejecutar export final de base/archivos, aplicar el delta, validar las métricas y cambiar DNS. Conservar Manus como rollback hasta que se complete una ventana de verificación acordada. Este paso no debe ejecutarse sin un plan de pruebas y backup aprobado.

## Despliegue portable de referencia

El proyecto ya contiene comandos estándar:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
NODE_ENV=production pnpm start
```

El servidor Express sirve tRPC bajo `/api/trpc` y los activos compilados desde `dist/public`. Un proveedor compatible debe exponer `PORT`, mantener HTTPS detrás de proxy y permitir cookies seguras. La configuración del proxy debe reenviar `X-Forwarded-Proto` para que la cookie de sesión se comporte correctamente.

## Lista de aceptación antes de salir

- [ ] La usuaria verifica que es propietaria o administradora del repositorio GitHub y activa 2FA.
- [ ] Existe un dominio registrado fuera de Manus con acceso a DNS y renovación.
- [ ] Se decide MySQL propio o conversión a PostgreSQL/Supabase; si se elige Supabase, se reescriben schema/migraciones a dialecto Postgres.
- [ ] Se genera y versiona la migración pendiente de `users`.
- [ ] Se exportan y restauran base de datos y audios en staging.
- [ ] Se sustituyen los cuatro adapters: auth, LLM, storage y notificación.
- [ ] Se reemplaza/elimina analítica Manus y el runtime plugin de Vite.
- [ ] Se configuran callback OAuth, secretos y futuros webhooks en el dominio propio.
- [ ] Staging pasa los flujos públicos, administración, pago, audio y pruebas técnicas.
- [ ] Se agenda el corte con backup y rollback definidos.

## Referencias técnicas

[1] [Node.js — guía de despliegue](https://nodejs.org/en/learn/getting-started/deploying-nodejs-applications)  
[2] [Express — behind proxies](https://expressjs.com/en/guide/behind-proxies.html)  
[3] [Drizzle Kit — migraciones](https://orm.drizzle.team/docs/kit-overview)  
[4] [AWS SDK for JavaScript v3 — S3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/)  
