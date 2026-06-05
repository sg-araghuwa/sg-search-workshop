# Input Reconciliation — epics.md

**Input:** `_bmad-output/planning-artifacts/epics.md`
**Compared against:** `prd.md`, `addendum.md`

## Coverage Summary

| Source item | PRD location | Status |
|-------------|--------------|--------|
| FR1–FR17 | §4.1–§4.4 | ✓ All present, IDs match |
| NFR1–NFR10 | §6 | ✓ All present |
| UX-DR1–UX-DR10 | §7 | ✓ All present |
| Epic 1 / Epic 2 scope notes | §4 grouping, §9 brownfield | ✓ Aligned |
| Story acceptance criteria detail | Not in PRD (by design) | ✓ Lives in epics — appropriate |
| Additional Requirements (packages, env, CORS) | `addendum.md` | ✓ Captured |

## Gaps (2)

1. **Epic story-level Given/When/Then** — Rich acceptance criteria in epics (Stories 1.1–2.5) are not duplicated in PRD. *Qualitative gap:* none for PRD purpose; epics remain authoritative for implementation. *Action:* none — correct separation.

2. **Scope note on superseding BmadPoc non-goal** — Epics explicitly supersede "No Authentication/Authorization." PRD captures via frontmatter `supersedes` and §0. ✓ Resolved.

## Verdict

**Fully reconciled** for PRD-level requirements. No PRD edits required from epics input.
