# Sorenza Desktop 0.3.0

Sorenza Desktop is the application-first evolution of the Sorenza VS Code extension. The desktop app is the product; VS Code/Codespaces become connected execution environments rather than the UI boundary.

## Product thesis

A user describes an outcome. Sorenza creates a mission contract, prepares an isolated candidate workspace, coordinates AI work, executes independent quality gates, collects evidence, and only then offers a verified change for promotion.

```text
Objective
  -> Mission Contract
  -> Trust Kernel
  -> Candidate Workspace
  -> Agent Runtime
  -> Evidence Gate
  -> Verified Promotion
```

The model is never the final authority for PASS.

## Current 0.3.0 deliverable

Implemented and validated in this package:

- desktop-first React interface with progressive disclosure;
- Tauri 2 shell source with a minimal capability surface;
- GitHub Codespaces discovery/opening commands through `gh`;
- typed domain contracts for missions, evidence, skills and projects;
- deterministic mission state machine;
- deterministic Trust Kernel baseline;
- deterministic Evidence Gate baseline;
- Codespaces connector with candidate Git worktrees under `/tmp/sorenza`;
- structured read/write helpers for candidate files;
- fixed quality gates (`typecheck`, `lint`, `test`, `build`), not arbitrary terminal access;
- diff extraction from the candidate workspace;
- OpenAI Agents SDK runtime adapters for sandbox and Codespaces tool orchestration;
- Skills, Agents and Evidence product surfaces;
- responsive UI and `prefers-reduced-motion` support.

Not yet production-complete:

- native Tauri installer was not compiled in the current build container because Rust/system WebView build dependencies are unavailable there;
- the Codespaces connector was typechecked and unit-tested for validation, but not exercised against a live authenticated `gh` session in this environment;
- full end-to-end mission persistence, signed promotion, Stronghold-backed API-key UX and multiagent execution are architecture-ready but not fully wired into the UI;
- visual/browser evidence is represented in the product model but Playwright execution is not yet connected to the mission worker.

## Architecture

```text
┌───────────────────────────────────────────────┐
│ Sorenza Desktop                             │
│ React UI + Design System                      │
└──────────────────────┬────────────────────────┘
                       │ typed commands/events
┌──────────────────────▼────────────────────────┐
│ Tauri Security Shell                          │
│ minimal commands + capabilities + Stronghold  │
└──────────────────────┬────────────────────────┘
                       │
┌──────────────────────▼────────────────────────┐
│ Mission Core                                  │
│ contract · state · trust · budgets · evidence │
└───────────────┬───────────────────┬───────────┘
                │                   │
       ┌────────▼────────┐  ┌───────▼──────────┐
       │ Agent Runtime   │  │ Project Connector│
       │ OpenAI adapter  │  │ Codespaces / local│
       └────────┬────────┘  └───────┬──────────┘
                │                   │
                └─────────┬─────────┘
                          ▼
                 Candidate Workspace
                          │
                          ▼
                    Evidence Gate
                          │
                          ▼
                   Verified Promotion
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

## Development

Prerequisites for the web shell:

- Node.js 22+
- npm 10+

```bash
npm install
npm run check
npm run dev
```

For native Tauri development, install the official Tauri prerequisites for your platform plus Rust. The app also expects GitHub CLI (`gh`) when connecting to GitHub Codespaces.

```bash
npm run tauri dev
```

## Quality gates

```bash
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npm run build
```

## Security stance

- The renderer does not receive a generic shell bridge.
- Tauri frontend permissions stay minimal.
- Codespace names and workspace paths are validated.
- Candidate work is isolated from the primary checkout with a Git worktree.
- Remote quality commands are selected from a fixed gate enum.
- The AI can submit a candidate report, but cannot declare final PASS.
- Production/deploy capabilities do not belong in Core v1.

A candidate Git worktree is not equivalent to a kernel sandbox. Production autonomy still requires stronger workload isolation and egress controls.

## Design principle

**Maximum capability behind the interface, minimum cognitive load in front of it.**

The main surface shows only:

1. project;
2. objective;
3. mission state;
4. specialists actually working;
5. evidence required for completion.

Advanced controls remain available through contextual surfaces instead of permanent dashboard clutter.
