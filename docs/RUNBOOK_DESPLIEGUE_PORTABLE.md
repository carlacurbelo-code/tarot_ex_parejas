# Runbook de despliegue portable

Este runbook describe **cómo quedará el despliegue una vez sustituidos los adapters de Manus**. No implica ni ejecuta una migración actual.

## Prerrequisitos

| Categoría | Requisito |
|---|---|
| Runtime | Node.js 22+, pnpm y un host que permita proceso HTTP persistente o contenedor Node. |
| Base | MySQL compatible con la configuración Drizzle actual, o una conversión explícita a PostgreSQL antes de elegir Supabase. |
| Secretos | Variables de `.env.portable.example` cargadas en el proveedor destino. |
| Storage | Bucket S3 compatible con lectura/escritura y URLs firmadas. |
| Auth | Proveedor OAuth/configuración de sesión alternativa. |
| DNS | Dominio propio con HTTPS y callback OAuth registrado. |

## Secuencia de staging

1. Crear una rama de migración sin tocar `main`.
2. Sustituir los adapters de auth, LLM, storage y notificación.
3. Generar y revisar la migración pendiente de `users`; aplicar todas las migraciones a una base de staging vacía.
4. Cargar secretos y ejecutar:

   ```bash
   pnpm install --frozen-lockfile
   pnpm check
   pnpm test
   pnpm build
   NODE_ENV=production pnpm start
   ```

5. Configurar HTTPS, proxy y `X-Forwarded-Proto`.
6. Registrar `https://staging.tu-dominio.com/api/oauth/callback` en el proveedor de autenticación.
7. Probar lectura de una carta, profundización, cambio de contexto, restricciones, panel admin, carga/descarga de audio, confirmación de pago y notificación.

## Corte de producción

No cortar directamente. Primero realizar backup de la base y de audios, copiar los objetos a storage propio, aplicar el delta final de datos y validar el dominio de staging. Luego cambiar DNS con una ventana de rollback en la que Manus siga disponible. La plataforma actual se apaga sólo cuando las pruebas post-corte y la restauración de muestra resulten correctas.

## Datos que no deben migrarse desde Git

Nunca copiar `.project-config.json`, valores de `.env*`, credenciales de Forge, cookies, logs de desarrollo ni claves de la plataforma. Git ya ignora esos artefactos; la salida debe usar exclusivamente secretos recreados bajo cuentas controladas por la usuaria.
