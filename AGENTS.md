<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Graphify (knowledge graph)

This repo keeps a code graph under [`graphify-out/`](graphify-out/).

- **Before** answering architecture questions, tracing impact across modules, or planning multi-file refactors, read **[`graphify-out/GRAPH_REPORT.md`](graphify-out/GRAPH_REPORT.md)** (god nodes, clusters, knowledge gaps). Optionally use [`graphify-out/graph.json`](graphify-out/graph.json) or `graphify query "…"` for targeted questions.
- **After** a session makes substantive changes to source files, refresh the graph so it stays accurate:

  `graphify update .`

  (Use your installed `graphify` on PATH, e.g. `~/Library/Python/3.12/bin/graphify update .` if needed.)

If `graphify-out/wiki/index.md` exists in the future, prefer it as a navigator over ad-hoc file reads.
