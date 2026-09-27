# Calculadora de Salario Neto — Costa Rica

Aplicación web que calcula el **salario neto** de una persona trabajadora en Costa Rica a partir de su **salario bruto**, aplicando las rebajas de ley correspondientes (cargas sociales de la CCSS / LPT e impuesto sobre la renta).

> **Estado:** walking skeleton. El flujo de extremo a extremo (entrada del salario bruto → resultado) existe, pero el cálculo de rebajas todavía no está implementado.

## Stack

| Herramienta                                       | Uso                            |
| ------------------------------------------------- | ------------------------------ |
| [TypeScript](https://www.typescriptlang.org/)     | Lenguaje (modo `strict`)       |
| [Vite](https://vite.dev/)                         | Servidor de desarrollo y build |
| [Vitest](https://vitest.dev/)                     | Runner de tests                |
| [ESLint](https://eslint.org/) + typescript-eslint | Linter                         |
| [Prettier](https://prettier.io/)                  | Formato de código              |

## Requisitos

- Node.js >= 20.19
- npm >= 10

## Inicio rápido

```bash
npm install
npm run dev      # abre la app en http://localhost:5173
```

## Scripts

| Comando                | Descripción                                    |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo con recarga en caliente |
| `npm run build`        | Verifica tipos y genera el build en `dist/`    |
| `npm run preview`      | Sirve el build de producción localmente        |
| `npm test`             | Ejecuta los tests una vez                      |
| `npm run test:watch`   | Ejecuta los tests en modo watch                |
| `npm run lint`         | Ejecuta ESLint                                 |
| `npm run lint:fix`     | Ejecuta ESLint corrigiendo lo posible          |
| `npm run format`       | Formatea el código con Prettier                |
| `npm run format:check` | Verifica el formato sin modificar archivos     |
| `npm run typecheck`    | Verifica tipos con `tsc`                       |

## Estructura

```
.
├── index.html            # Punto de entrada HTML
├── src/
│   ├── main.ts           # Arranque de la UI (formulario de salario bruto)
│   ├── style.css
│   └── shared/           # Utilidades compartidas (p. ej. formato de colones)
├── tests/
│   └── unit/             # Tests unitarios (*.test.ts)
├── eslint.config.js
├── vite.config.ts        # Configuración de Vite y Vitest
└── tsconfig.json
```
