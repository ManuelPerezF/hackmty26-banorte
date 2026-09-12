# Banorte client

Frontend importado de `banorte-landing` para el reto Banorte × Tec. Conserva la landing, acceso de demostración, panel y sus secciones. El contenido del panel está orientado a banca personal.

## Ejecutar

Requiere Node.js >=22.13 y npm.

```sh
cd client
npm ci
npm run dev
```

Abrir http://127.0.0.1:3000. La cuenta de acceso está precargada con datos ficticios.

```sh
npm run typecheck
npm run lint
npm run build
npm run start
```

Se conserva el stack del proyecto original: React 19, TypeScript, Vinext/Vite con App Router, Tailwind CSS 4, Base UI, Lucide y GSAP. La fuente Outfit se sirve localmente. La configuración de despliegue y los identificadores de hosting del proyecto de origen no forman parte de esta importación.

## Screaming architecture

Estructura basada en `kent/client`: módulos de negocio dentro de `src/modules`, cada uno dividido por responsabilidades. Se conserva App Router porque es el router de esta aplicación.

```text
client/src/
├── app/                         # Rutas /, /login y /panel, más layout raíz
├── modules/
│   ├── landing/
│   │   ├── views/               # Composición de la landing
│   │   ├── components/          # Header, hero, banca digital y footer
│   │   └── styles/
│   ├── auth/
│   │   ├── views/login.tsx
│   │   ├── components/authPanel.tsx
│   │   ├── hooks/useAuth.ts
│   │   └── styles/
│   ├── home/
│   │   ├── views/home.tsx
│   │   ├── components/homeOverview.tsx
│   │   ├── services/home.service.ts
│   │   ├── types/home.types.ts
│   │   └── data/
│   ├── tarjetas/
│   │   ├── views/tarjetas.tsx
│   │   ├── components/
│   │   ├── hooks/useTarjetas.ts
│   │   ├── services/tarjetas.service.ts
│   │   ├── types/tarjetas.types.ts
│   │   ├── data/
│   │   └── styles/
│   ├── asistente/
│   │   ├── views/asistente.tsx
│   │   ├── components/asistentePanel.tsx
│   │   ├── hooks/useAsistente.ts
│   │   ├── services/asistente.service.ts
│   │   ├── types/asistente.types.ts
│   │   └── data/
│   ├── perfil/
│   │   └── views/               # Perfil y configuración
│   └── panel/
│       ├── views/panel.tsx      # Compone las vistas bancarias
│       ├── hooks/usePanel.ts    # Navegación, búsqueda y selección de sesión
│       └── data/
└── shared/
    ├── layout/
    │   ├── app-shell.tsx
    │   ├── sidebar.tsx
    │   ├── layout.types.ts
    │   └── styles/
    ├── components/
    │   └── ui/                 # Primitivas Base UI
    ├── hooks/
    ├── lib/
    └── styles/                 # Base visual importada
```

### Responsabilidades y dependencias

- `app`: adaptación al router. Importa las vistas de los módulos.
- `views`: conecta datos y hooks con componentes; `panel/views/panel.tsx` compone los módulos dentro del layout.
- `components`: presentación e interacción de cada dominio.
- `hooks`: estado y comportamiento de acceso, tarjetas, conversación y navegación.
- `services`: operaciones del dominio y acceso a datos. Los servicios actuales trabajan con datos locales; no simulan conexiones remotas inexistentes.
- `types`: contratos del dominio. `data` conserva los catálogos y movimientos ficticios.
- `shared/layout`: estructura visual común. Recibe navegación, acciones y contenido por props, sin importar módulos.
- `shared/components/ui`: controles reutilizables sin lógica bancaria.
- Los imports entre módulos apuntan a archivos explícitos, como en Kent. Los imports internos usan rutas relativas.
- Cada módulo incorpora solo las capas que utiliza. No se crean servicios ni hooks vacíos para vistas estáticas.
- Los futuros dominios `ahorro`, `educacion` e `inversiones` seguirán el mismo patrón cuando se implementen.

Las credenciales del LLM y la ejecución de herramientas MCP pertenecen al servidor. Los servicios del cliente solo deberán consumir endpoints públicos de esa capa.

## Rutas y secciones

| Ruta     | Contenido                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------- |
| `/`      | Navegación, hero con Infinite/Oro/Clásica, sección de banca digital y footer                          |
| `/login` | Acceso de demostración, contraseña de ejemplo visible/oculta y ayuda                                  |
| `/panel` | Inicio, Chat, Tarjetas, Transferencias, Cuentas, Gastos, Perfil, Beneficios, Análisis y Configuración |

Las secciones del panel conservan la navegación en memoria de la aplicación original. No son rutas independientes. Recargar o salir del panel reinicia el estado de demostración.

## Tarjetas

`modules/tarjetas/data/card-catalog.ts` es la fuente única de producto, imagen, red y presentación. El catálogo contiene Infinite Visa, Oro Visa, la Clásica Visa adjunta y la tarjeta roja Mastercard del origen. “Roja” es una etiqueta visual de demostración, no una identificación comercial verificada.

La landing muestra Infinite, Oro y Clásica. El panel permite elegir las cuatro, con presentación física o digital. La selección se refleja en Inicio y Configuración durante la sesión del panel. No se solicitan tarjetas ni se generan cargos.

Las imágenes se copian sin modificar. `CardArtwork` aplica recortes CSS según la composición de cada archivo.

## Alcance actual

- El acceso es una demostración, no autenticación real.
- El asistente conserva dos escenarios simulados del origen: gastos y flujo de efectivo. No tiene conexión a un LLM, MCP o A2UI real.
- Transferencias, Cuentas, Gastos, Beneficios y Análisis conservan los estados vacíos informativos del origen.
- No se incluyen operaciones bancarias reales, servicios del backend ni el flujo de ahorro todavía.
- Los enlaces externos de productos siguen apuntando al sitio oficial de Banorte.

No se copiaron el repositorio Git de origen, videos, builds ni configuración de hosting. Solo se importaron los componentes UI necesarios para las páginas, junto con sus dependencias.
