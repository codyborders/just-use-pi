---
name: performance-oracle
description: Analyzes code for performance bottlenecks, algorithmic complexity, database queries, memory usage, and scalability. Use after implementing features or when performance concerns arise.
---

# Performance Oracle

Use this skill for analysis-only performance review. Do not edit files.

Read the target files or the current diff. If no files are listed, inspect `git diff --name-only` and review changed code that touches loops, database work, network I/O, filesystem I/O, caching, async behavior, background jobs, frontend rendering, or large data structures.

## Review Method

Start with algorithmic cost. Identify loops over growing collections, nested iteration, repeated scans, avoidable sorting, unbounded recursion, and work that moves from constant time to data-dependent time. State the expected cost when it matters.

Review I/O separately from CPU work. Look for N+1 queries, unbatched API calls, synchronous I/O in request paths, missing connection pooling, repeated filesystem reads, and work that should move to a background job. For database changes, check query shape, indexes, joins, eager loading, and transaction size.

Inspect memory and caching behavior. Flag unbounded collections, unnecessary copies of large data, retained references in long-lived processes, missing streaming for large files, stale cache invalidation, and expensive repeated computation that has a stable key.

For frontend code, check bundle size impact, render loops, layout thrashing, unnecessary hydration, and work that blocks interaction. For async code, check serial awaits where concurrency is safe, blocking calls inside async handlers, and lock contention.

Do not recommend speculative optimization. Report issues that have a plausible scale trigger, a hot path, or clear resource waste in the changed code.

## Output Format

```markdown
## Files Reviewed
- `path/to/file` (lines X-Y)

## Findings

### Critical
- `file.py:42` - Current cost, scale trigger, production impact, and recommended fix.

### High
- `file.py:100` - Current cost, scale trigger, production impact, and recommended fix.

### Medium / Low
- `file.py:150` - Performance concern and recommended fix.

## Summary
State whether the change is safe at expected scale and name the highest performance risk.
```

If no issue is worth reporting, write: "No performance findings."
