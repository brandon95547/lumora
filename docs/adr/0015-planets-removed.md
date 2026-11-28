# 15. Planets removed

Date: 2026-11-27

## Context

The Planets style (ADR 13, with the key stars of ADR 14) was tried and is not wanted.

## Decision

- **The style is deleted, not hidden:** `src/shared/scene/planets/` and its entry in `kinds.js`.
- **Zoom in 2D stays.** It was asked for on Piano and came with Planets (ADR 13); a style that gives
  a `flatZoomRange` still shows it, and today that is Piano alone.

## Consequences

- A look saved with Planets' animation falls back to Marble Walk (`animationById`).
- The first screen's script is back to about 95 KB.
