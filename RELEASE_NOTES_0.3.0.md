# Sorenza Desktop 0.3.0 — App-First Foundation

## Strategic change

Sorenza is now designed as a desktop application first. The previous VS Code extension remains conceptually useful as an optional connector, but it is no longer the primary product surface.

## What is implemented

- Tauri 2 desktop shell configuration with restrictive capability policy.
- React 19 mission-control interface with progressive disclosure and responsive states.
- Deterministic Mission State Machine, Trust Kernel and Evidence Gate.
- Typed Mission Contract and Skill Manifest schemas.
- OpenAI Agents SDK adapter using Sandbox Agent primitives.
- Codespaces agent runtime with structured tools.
- Typed GitHub Codespaces connector that creates candidate git worktrees, reads/writes candidate files, runs fixed quality gates and extracts diffs.
- Design system "Quiet Intelligence".
- Initial screens for Home, Projects, Missions, Team, Skills and Evidence.

## Validation performed

- TypeScript strict: PASS
- ESLint: PASS
- Unit tests: 13/13 PASS
- Test files: 5/5 PASS
- Production frontend build: PASS
- npm audit: 0 vulnerabilities reported
- Core/contracts measured coverage: 94.11% lines, 82.14% branches, 100% functions

## Important limitations

- The native Tauri binary was not compiled in this environment because Rust and Linux WebKit system dependencies are unavailable here.
- Live GitHub Codespaces operations were not executed because this environment does not provide an authenticated `gh` session.
- A real OpenAI API mission was not executed because no user API credential was used.
- Kernel-grade sandboxing, egress enforcement, durable distributed orchestration and atomic verified promotion remain production-hardening work.

## Product position

0.3.0 is an app-first architectural foundation and production-quality frontend build, not a claim that the entire autonomous platform is already production complete.
