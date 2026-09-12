# Producto

## Register

product

## Contexto confirmado

Prototipo para el reto Banorte del Tec. Banca personal como base, con educación financiera contextual y una futura extensión de simulación de inversiones. La landing y las páginas de acceso y panel se importan del proyecto banorte-landing por petición del usuario, preservando su identidad visual. Los componentes del agente se organizarán por dominio.

## Referencia y alcance

La implementación local de banorte-landing es la referencia de diseño. Conservar sus colores, tipografía, navegación por teclado y soporte de movimiento reducido. El asistente importado es simulado. La conexión LLM, MCP y A2UI es trabajo posterior.

## Organización del código

La referencia estructural indicada por el usuario es kent/client: src/modules con views, components, hooks, services y types según las necesidades del módulo. El layout se comparte en shared/layout y las primitivas en shared/components/ui.

## Pantallas del MVP

Inicio, Asistente, Tarjetas, Metas y Perfil. Landing y Acceso son las páginas públicas. Perfil integra configuración, Inicio integra movimientos y Asistente será el lugar de educación e inversiones. Metas guarda objetivos de demostración durante la sesión del panel.
