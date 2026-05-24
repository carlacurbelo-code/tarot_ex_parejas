# Project TODO - Tarot para Ex Parejas

## Setup & Diseño Base
- [x] Configurar paleta de colores (tonos tierra + azules suaves) en index.css
- [x] Configurar tipografía elegante (Google Fonts: Cormorant Garamond + Inter)
- [x] Configurar tema base íntimo/cálido en App.tsx

## Base de Datos
- [x] Schema: tabla `orders` (cliente, situación, cartas, lectura IA, estado, audioKey, paypal info)
- [x] Schema: tabla `settings` (precio configurable, link PayPal)
- [x] Push migrations

## Backend (tRPC + APIs)
- [x] Router `tarot.getDeck` - mazo de cartas
- [x] Router `tarot.submitReading` - lectura IA gratuita con LLM (cierre abierto)
- [x] Router `tarot.getReading` - acceso público por token
- [x] Router `tarot.savePremiumQuestion` - pregunta para audio premium
- [x] Router `tarot.confirmPayment` - confirmar pago PayPal y notificar dueña
- [x] Router `tarot.getPremiumPrice` - precio público actual
- [x] Router `admin.listOrders` - admin ve todos los pedidos (protegido)
- [x] Router `admin.uploadAudio` - admin sube MP3 (storagePut)
- [x] Router `admin.markCompleted` - admin marca pedido como completo
- [x] Router `admin.getSettings` / `admin.updateSettings` - precio + paypal link configurables
- [x] Tests vitest (14 tests pasando)

## Frontend
- [x] Landing Page mobile-first con headline emocional íntimo
- [x] Formulario: situación con ex pareja
- [x] Selección visual de 3 cartas de tarot
- [x] Pantalla de lectura IA (tono íntimo, cierre abierto)
- [x] Sección upsell post-lectura con botón PayPal
- [x] Pantalla de confirmación de pago manual
- [x] Página del cliente para acceder a su audio (con token)

## Panel Admin
- [x] Login admin con Manus OAuth + role admin
- [x] Lista de pedidos segmentada (para entregar / esperando pago / completados)
- [x] Botón subir MP3 por pedido (auto-marca como completado)
- [x] Botón marcar como completado manualmente
- [x] Configuración de precio premium y enlace PayPal.me
- [x] Copiar enlace de la cliente (acceso al pedido)

## Notificaciones
- [x] notifyOwner automática cuando se confirma pago

## Testing & Delivery
- [x] Tests TypeScript pasando (no errors)
- [x] Tests vitest pasando (14/14)
- [x] Mobile-first verificado
- [x] Checkpoint final
