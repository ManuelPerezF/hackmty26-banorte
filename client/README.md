# Banorte client

Frontend React 19, TypeScript y Vinext, conectado a Nest. Conserva la identidad Banorte y la organización por funcionalidades del proyecto de referencia Kent.

## Ejecutar

Requiere Node >=22.13 y backend disponible en el puerto 3001.

```sh
cd client
npm ci
npm run dev
```

Abrir `http://127.0.0.1:3000`. Acceso únicamente con una de las dos cuentas configuradas; sin registro público. La contraseña no se precarga. `VITE_API_BASE_URL` es opcional, ver `.env.example`.

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Screaming architecture

```text
src/
├── app/                        # /, /login, /panel
├── modules/
│   ├── landing/                # Presentación y acceso
│   ├── auth/                   # Inicio de sesión real
│   ├── cuentas/context/        # Sesión, perfil, cuenta, tarjetas
│   ├── home/                   # Saldo y actividad
│   ├── tarjetas/               # Tarjetas propias y catálogo visual
│   ├── movimientos/            # Registro, historial, filtros y detalle
│   ├── metas/                  # Crear, editar y archivar objetivos
│   ├── simulaciones/           # Escenario de ahorro dentro de Metas
│   ├── asistente/              # Conversaciones, SSE, A2UI y acciones
│   ├── perfil/                 # Perfil y cierre de sesión
│   └── panel/                  # Composición de las seis secciones
└── shared/
    ├── api/                    # HTTP, cookies, CSRF, tipos, idempotencia
    ├── layout/                 # Navegación y estructura común
    ├── components/ui/          # Primitivas Base UI
    ├── hooks/
    ├── lib/
    ├── utils/
    └── styles/
```

Cada módulo usa `views`, `components`, `hooks`, `services`, `types`, `data` y `styles` según sus necesidades. `app` adapta el router; `panel` compone las secciones sin añadir rutas. Los hooks conectan operaciones HTTP; los componentes presentan datos e interacciones. Las credenciales del LLM y las herramientas MCP permanecen en Nest.

## Datos y experiencia

Inicio, Movimientos, Cuentas y tarjetas, Metas y Perfil usan los datos de la sesión. Cada usuario tiene una cuenta MXN y ve únicamente las tarjetas asignadas en PostgreSQL. Los perfiles nuevos empiezan sin actividad ni tarjetas inventadas. El catálogo visual de la landing mantiene Clásica, Oro e Infinite. `CardArtwork` presenta los assets locales por `product.imageKey`; no se permiten URLs generadas por el modelo.

Movimientos envía centavos enteros, categoría, fecha, nota y UUID de tarjeta (o null para cuenta personal). La API devuelve asociaciones que aparecen en historial/detalle. Metas persiste objetivos sin mover fondos; el simulador usa los supuestos capturados por el usuario.

El Asistente muestra historial de conversaciones, preguntas sugeridas y bloques generados por el backend. Su renderer valida catálogo, superficie y datos con Zod. El ciclo formulario → revisión → confirmar → recibo persiste por MCP y actualiza saldo/historial. Los errores no se convierten en éxitos ficticios.

No se carga el ledger desde localStorage. Se eliminaron las utilidades de almacenamiento local, los fixtures de movimientos/cuentas y el clasificador simulado del asistente. La API pagina; el cliente reúne las páginas antes de aplicar filtros visuales. Para historiales masivos, migrar la navegación a consultas paginadas por filtro.

Gemini requiere su clave en `server/.env`. Se validó Flash-Lite real con un perfil vacío, formulario generado, confirmación, persistencia y restauración de conversación. [Integración y validación](../docs/frontend.md).

## Referencias de Mobbin

- [Revolut Business: gastos](https://mobbin.com/screens/45d6266f-7729-4554-a483-7f7182b66731) y [detalle](https://mobbin.com/screens/294b3412-6700-42f7-b1b4-2a24e1d1a1b5).
- [Wise: historial](https://mobbin.com/screens/2930c3d1-40a7-45ac-95a1-b9dea8652ea2) y [detalle](https://mobbin.com/screens/1a4d823e-2938-4a00-857b-e61751930663).
- [Chatbot: Copilot, Zapier y Notion](../docs/chatbot-referencias.md), consultados mediante el MCP de Mobbin.
