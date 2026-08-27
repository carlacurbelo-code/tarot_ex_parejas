# Nuevo modelo de monetización — Tarot de Medianoche

## Funnel

La usuaria elige una vertical, escribe una pregunta, selecciona tres cartas del mazo completo de 78 y recibe la interpretación completa sin introducir email. Una cookie anónima de primera parte limita el beneficio a una lectura, con una señal de rate limiting temporal por IP hash ante automatización evidente. El detalle operativo está documentado en `ACCESO_GRATUITO_ANONIMO.md`.

El email se solicita solamente al comprar créditos. No se crean cuentas, contraseñas ni logins: el perfil por email persiste para la compra y la cookie anónima enlaza los créditos a ese navegador.

## Créditos

El pack nuevo es un pago único de USD 6,99 en Dodo Test Mode y concede tres créditos persistentes. Cada lectura paga recibe una pregunta nueva, una tirada independiente de tres cartas y una interpretación de Gemini; el crédito se descuenta atómicamente antes de generar y se restaura si Gemini falla. Al quedar sin créditos se ofrece una nueva compra.

## Dodo y marcas

El checkout usa `DODO_CREDIT_PACK_PRODUCT_ID` y metadata `tarot_pack_token`. El webhook verifica primero la firma con `DODO_PAYMENTS_WEBHOOK_KEY`, luego exige `DODO_TAROT_BRAND_ID`, registra el `webhook-id` para idempotencia y recién después acredita el pack. Eventos de otra marca o sin marca se ignoran con HTTP 200. La separación detallada está en `DODO_SEPARACION_MARCAS_TEST.md`.

## IA

El adapter `server/_core/llm.ts` utiliza `TAROT_LLM_MODEL`, cuyo valor predeterminado es `gemini-2.5-flash-lite`. El modelo se envía server-side y se usa tanto en la lectura gratuita como en las lecturas consumidas por crédito.

## Variables

`DODO_CREDIT_PACK_PRODUCT_ID` identifica el producto de tres créditos; `DODO_TAROT_BRAND_ID` identifica la marca Tarot de Medianoche; `DODO_PAYMENTS_WEBHOOK_KEY` verifica eventos; `DODO_PAYMENTS_API_KEY` permite consultar productos y crear checkout; `DODO_PAYMENTS_ENVIRONMENT` permanece en `test_mode` durante QA; `TAROT_LLM_MODEL` permite fijar explícitamente el modelo.

## Flujo heredado

`orders`, `Reading.tsx`, PayPal, audio, confirmación manual y panel de administración permanecen separados y no se reutilizan para el funnel de email/créditos.

## Privacidad

El footer informa el uso de la cookie anónima de primera parte, el rate limiting temporal por IP hash y que el email se usa sólo para asociar créditos comprados. El marketing es opcional, separado de la compra y revocable. Este copy es informativo; antes de operar a escala debe revisarse con asesoría legal aplicable a las jurisdicciones objetivo.
