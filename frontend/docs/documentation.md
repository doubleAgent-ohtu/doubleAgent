
# Frontend Documentation

## Requirements

**Preferred:** Docker-compose Development Setup. Use the root `docker-compose.yml` to build and run the entire application (frontend + backend). See `README.md` for more details.

**Development Requirements:**
- Node.js 24+
- npm (for installing dependencies and running scripts)
- Vite dev server for local development

**Production Build:**
- Use the provided `Dockerfile` to build a production-ready image that installs all dependencies and outputs an optimized bundle ready for static hosting.

## Technologies

The frontend is a Single Page Application built with **React** and bundled with **Vite**.

**Key Technologies:**
- **React** — UI library for building the SPA
- **Vite** — Development server and bundler
- **CSS / Tailwind (optional)** — Global styles (see `src/index.css`)
- **React Testing Library & Vitest** — Unit testing framework
- **Docker** — Development and production containerization

## Structure

Top-level frontend files and tooling live in the `frontend/` directory:

- `package.json` — Dependencies and scripts
- `vite.config.js` — Vite configuration
- `.eslintrc`, `eslint.config.js`, `prettier.config.js` — Linting and formatting configs (if present)
- `Dockerfile` — Production image build
- `Dockerfile.dev` — Development container build

### Source Code (`src/`)

- `src/main.jsx` — React entry point used by `index.html`
- `src/App.jsx` — Root application component and router
- `src/index.css` — Global CSS styles and optional Tailwind + DaisyUI imports

### Components (`src/components/`)

Key UI and logic components (each typically with an optional `*.test.jsx`):

- `BotConfigurator.jsx` — Chatbot configuration interface
- `Conversation.jsx` — Chat UI and conversation view
- `ModelSelection.jsx` — Model selection interface
- `PromptEditorModal.jsx` — Modal for editing prompts
- `HealthCheckButton.jsx` — API health check button
- `HamburgerMenu.jsx` — Mobile navigation menu
- `Menu.jsx` — Main navigation menu
- `Kayttoohje.jsx` — Usage instructions view
- `Tietosuojaseloste.jsx` — Privacy policy view

Component tests are stored alongside components as `*.test.jsx` files (e.g., `Menu.test.jsx`, `Conversation.test.jsx`).

## Testing

Tests use **Vitest** and **React Testing Library**.

Run tests locally:

```bash
cd frontend
npm install
npm run test
```

Unit tests live alongside components under `src/components/` and `src/pages/` as `*.test.jsx` files.
