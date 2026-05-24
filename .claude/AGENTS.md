<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

## Rules 參考文件

| 檔案 | 說明 |
|------|------|
| `.claude/rules/foundation.md` | 技術棧、目錄結構、build 產出、git hygiene |
| `.claude/rules/task.md` | Change 實作順序與依賴鏈 |
| `.claude/rules/CI.md` | Argos CI / Playwright 視覺測試流程與重命名規則 |

## Openspec Change 建立規則

**錯誤原因**：建立新的 `openspec/changes/<name>/` 時，只看了頂層 `openspec/specs/` 的目錄，
假設 change 只需要 `proposal.md`、`design.md`、`tasks.md` 三個檔案，
沒有驗證現有 change 目錄的完整結構，導致遺漏了 `specs/` 子目錄。

**解決方式**：建立 openspec change 前，必須先執行以下指令確認既有 change 的完整結構：

```bash
find openspec/changes/<any-existing-change> -type f | sort
```

確認所有必要檔案後再動手建立，checklist：

- [ ] `proposal.md`
- [ ] `design.md`
- [ ] `tasks.md`
- [ ] `specs/<affected-feature>/spec.md`（每個受影響的 feature 各一個）
