# Migration from Sorenza Extension to Sorenza Desktop

## Decision

The desktop application becomes the primary Sorenza product. The VS Code/Codespaces extension becomes an optional integration surface rather than the central runtime.

## Why

A full application can provide a coherent mission workspace, persistent project memory, evidence review, agent coordination, skills management, cost controls, approvals and cross-editor integrations without being constrained to a narrow VS Code sidebar.

## Preserved concepts from 0.2.0

- candidate workspace principle
- independent Evidence Gate
- Trust Kernel direction
- model/provider abstraction
- budgets
- auditability
- structured tool execution

## New app-first boundaries

1. UI shell: Tauri + React
2. Deterministic core: contracts, state, policy, evidence
3. Agent runtime: provider adapters and structured tools
4. Execution connectors: Codespaces first; local/remote later
5. Optional editor connector: VS Code extension only when deep editor integration is useful

## Non-goal

The desktop shell must never become a generic unrestricted terminal with AI authority. High-risk execution remains behind deterministic policy and independent evidence.
