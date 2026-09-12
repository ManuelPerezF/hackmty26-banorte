# Maya · Identidad del asistente

**Nombre:** Maya, elegido por el usuario. Asistente cercano para entender las cuentas y dar el siguiente paso.

**Símbolo:** dos trazos anchos y curvos que forman una n abstracta. El espacio entre ellos representa un intercambio. La silueta compacta sustituye el icono de billetera.

**Color:** rojo carmesí compatible con la identidad visual de Banorte. Objetivo de generación: `#D60832`. La interfaz conserva sus colores actuales; no cambia el logotipo principal del banco.

**Firma:** Maya / Asistente Banorte. El nombre se compone como texto HTML con Outfit; no está incrustado en la imagen.

## Archivos y uso

- `client/public/branding/maya-mark.png`: original generado de 1254 × 1254 px, PNG con transparencia real.
- `client/src/modules/asistente/components/maya-mark.tsx`: componente reutilizable, decorativo cuando acompaña el nombre o saludo.
- Tamaños de contenedor: cabecera 38 px; bienvenida 86 px (72 px móvil); firma de respuesta 24 px. La imagen contiene su margen de seguridad.
- Mantener proporción, transparencia y orientación; evitar sombras, recuadros adicionales y deformación. Si se usa sin texto que lo identifique, proporcionar un nombre accesible en su contexto.

El símbolo está integrado en cabecera, bienvenida y firma de respuestas. Los controles de acción siguen usando iconos funcionales; la sugerencia de ahorro utiliza una alcancía.

## Generación

Se utilizó la herramienta integrada `image_gen`, sin CLI ni llamadas API con claves del proyecto. El archivo se copió al directorio público del cliente; no depende de una ruta externa al repositorio. Es un recurso raster con aspecto vectorial, no un SVG.

Prompt original utilizado antes del cambio de nombre a Maya (se conserva como registro de generación del símbolo):

> Use case: logo-brand. Create ONE finished standalone symbol asset for Norte, a Spanish personal-finance AI chatbot inside a Banorte-themed app. No lettering. A memorable compact abstract lowercase n formed from two broad, softly rounded interlocking ribbon strokes, with a small negative-space opening suggesting two sides of a conversation and a gentle upward/northward direction. Professional, calm, warm and assured. Custom graphic identity, not a generic app icon. Flat vector-like graphic, precision curves, generous simple silhouette readable at 24px. Monochrome deep Banorte-compatible crimson red (#D60832); no gradients, no texture, no shadows, no 3D. Center a single symbol in a square canvas, filling roughly 78% of its width and height with an even small clear margin. TRUE transparent background with alpha. No background tile, no circle container, no border. No text, no wordmark, no presentation sheet, no variations, no mockup, no bank logo, no wallets, coins, currency signs, robot faces, sparkles or star symbols. This image will be the actual chatbot logo in a working UI.
