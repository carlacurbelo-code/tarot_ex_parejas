# Nuevo modelo de monetización — Tarot de Medianoche

## Funnel

La usuaria elige una vertical, escribe una pregunta y selecciona tres cartas del mazo completo de 78. Las tres cartas y sus orientaciones se muestran antes de pedir el email. El email es obligatorio para desbloquear la interpretación completa. El consentimiento de marketing se guarda en un checkbox independiente, opcional y desmarcado por defecto.

Cada email puede reclamar una única lectura gratuita. La identidad no utiliza cuenta, contraseña ni login: se normaliza a minúsculas y se persiste en `tarotProfiles`.

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

El footer informa que el email se usa para identificar la lectura gratuita, evitar usos repetidos y asociar créditos comprados. El marketing es opcional, separado del acceso y revocable. Este copy es informativo; antes de operar a escala debe revisarse con asesoría legal aplicable a las jurisdicciones objetivo.
