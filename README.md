# DevContext — Phase 1 MVP

AI-powered codebase understanding platform. Explore source files, trace
dependencies, and identify the blast radius of any change — entirely offline,
no API keys, no external services required.

---

## Quick Start

```bash
cd devcontext
npm install        # already done if you're reading this from the repo
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Demo Walkthrough

1. **Homepage loads** — the header shows live stats: 17 files, 27 edges, 1 cycle, 2 unresolved.
2. **Click "Open first file →"** to jump straight into `app.js`, or pick any file from the left sidebar.
3. **Browse the explorer** — folders collapse/expand; files show their language badge (JS / TS).
4. **Select `models/User.js`**:
   - Code viewer shows the full source with syntax highlighting and line numbers.
   - Dependency panel shows it imports `utils/crypto.js` and `utils/validators.js`.
   - Impact panel shows 9 total affected files (3 direct, 6 transitive).
5. **Select `config/env.js`** — impact shows 14/17 files affected (deepest shared dep).
6. **Select `services/userService.js`** — the Dependency panel highlights the
   **circular dependency** with `services/notificationService.js`.
7. **Select `app.js`** — the Dependency panel shows 2 **unresolved imports**
   (`express` — external package, correctly flagged).
8. **Click any file name** in the analysis panels to navigate directly to it.

---

## Project Structure

```
devcontext/
├── app/                         Next.js App Router
│   ├── layout.tsx               Root layout
│   ├── page.tsx                 Main interactive page (client component)
│   ├── globals.css              Dark developer-tool theme (CSS variables)
│   └── api/
│       ├── tree/route.ts        GET /api/tree
│       ├── file/route.ts        GET /api/file?path=
│       ├── graph/route.ts       GET /api/graph[?file=]
│       └── impact/route.ts      GET /api/impact?file=
│
├── components/
│   ├── Header.tsx               Top bar with DevContext branding + live stats
│   ├── FileExplorer.tsx         Collapsible file tree sidebar
│   ├── CodeViewer.tsx           Syntax-highlighted code viewer (shiki)
│   ├── DependencyPanel.tsx      Imports / imported-by / cycles / unresolved
│   ├── ImpactPanel.tsx          Blast-radius analysis with chain expansion
│   └── AnalysisSidebar.tsx      Right sidebar container
│
├── lib/                         Server-side analysis engine (pure TypeScript)
│   ├── fileDiscovery.ts         Recursive directory walker
│   ├── importParser.ts          Regex-based ESM + CJS import extractor
│   ├── importResolver.ts        Relative specifier → project file resolver
│   ├── graphBuilder.ts          Directed dependency graph + cycle detection
│   ├── impactAnalysis.ts        BFS reverse-graph traversal
│   ├── analyser.ts              Orchestrator + in-process cache
│   ├── fileTree.ts              Flat path list → nested tree structure
│   └── serverUtils.ts           Path traversal guard + shared helpers
│
├── types/index.ts               Shared TypeScript types (API ↔ UI)
│
└── sample-repo/                 Included demo project (17 JS/TS files)
    ├── app.js                   Entry point
    ├── config/env.js            Shared config (most deeply imported)
    ├── middleware/              auth.js, logger.js
    ├── models/                  User.js, Post.js
    ├── routes/                  authRoutes.js, postRoutes.js
    ├── services/                authService.js, postService.js,
    │                            tokenService.js, userService.js ↔ notificationService.js (circular)
    └── utils/                   crypto.js, validators.js, string.js, logger.ts (TypeScript)
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tree` | File tree + graph stats |
| GET | `/api/file?path=<rel>` | Raw file content + metadata |
| GET | `/api/graph` | Full dependency graph (nodes + edges) |
| GET | `/api/graph?file=<rel>` | Per-file: deps, dependents, cycles, unresolved |
| GET | `/api/impact?file=<rel>` | Impact analysis: direct + transitive affected files |

---

## Completed Features

- Real static analysis — no mock data anywhere
- ES module (`import`) and CommonJS (`require`) parsing
- Relative import resolution with extension probing and index-file fallback
- Directed dependency graph with full cycle detection (DFS)
- Transitive impact analysis via BFS on the reverse graph
- In-process analysis cache (re-scan only on server restart)
- Path traversal prevention on all file-serving routes
- Syntax-highlighted code viewer (shiki / github-dark theme)
- Collapsible file explorer with language badges
- Loading, empty, success, and error states on every panel
- Dependency chain expansion in the impact panel
- Clickable file references in analysis panels

## Known Limitations

- Analysis is read-only and server-restart-only; no file-watch / live reload of the graph
- Dynamic `import()` expressions are not parsed (static only)
- Non-relative imports (npm packages, path aliases like `@/`) are reported as unresolved
- No user-supplied repository support in Phase 1 — only the bundled sample-repo is analysed
- Cycle detection caps at 20 cycles to avoid pathological performance

## Tech Stack

- Next.js 16 (App Router) · TypeScript 5 · Tailwind CSS 4
- Shiki (syntax highlighting) · React 19
- Zero external runtime dependencies for the analysis engine
