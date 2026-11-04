// agent-scan：在啟動 coding agent 之前，列出 agent 會讀的指令檔 / 設定檔，並標出可疑內容。
//
// 用法：node agent-scan.ts [PATH]   （Node 22.18+ 內建 type stripping，不需要編譯）
// 回傳碼：有 HIGH 或 MEDIUM 為 1，否則 0；PATH 不存在為 2。
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

type Severity = "HIGH" | "MEDIUM" | "INFO";
export type Finding = { severity: Severity; rule: string; path: string; line: number; message: string };

const SKIP_DIRS = new Set([".git", "node_modules", "vendor", "dist", ".venv", "__pycache__"]);
const INSTRUCTION_NAMES = new Set(["AGENTS.md", "CLAUDE.md", "GEMINI.md", ".cursorrules", ".windsurfrules", ".clinerules"]);
const CONFIG_PATHS = [".mcp.json", ".claude/settings.json", ".claude/settings.local.json", ".codex/config.toml", ".vscode/mcp.json", ".cursor/mcp.json"];
const RUNNERS = new Set(["npx", "bunx", "uvx"]);
const MAX_SIZE = 1024 * 1024;

// 與 Python / Go 版完全相同的 regex；比對前先把 ASCII 字母轉小寫
export const DANGEROUS = new RegExp(
  String.raw`\b(?:curl|wget)\b[^|]*\|[ \t]*(?:sudo[ \t]+)?(?:ba|z)?sh\b` +
  String.raw`|\bbase64[ \t]+(?:-d|--decode)\b[^|]*\|[ \t]*(?:sudo[ \t]+)?(?:ba|z)?sh\b` +
  String.raw`|\bnpm[ \t]+(?:i|install)(?:[ \t]+[^ \t]+)*?[ \t]+(?:-g|--global)\b` +
  String.raw`|\biex[ \t]*\(|\|[ \t]*iex\b|\binvoke-expression\b`);
const OVERRIDE = new RegExp(
  String.raw`\bignore[ \t]+(?:all[ \t]+|the[ \t]+)?(?:previous|prior|above)[ \t]+instructions\b` +
  String.raw`|\b(?:do[ \t]+not|don't)[ \t]+(?:tell|inform|mention[ \t]+(?:this[ \t]+|it[ \t]+)?to)[ \t]+the[ \t]+user\b` +
  String.raw`|\bwithout[ \t]+(?:asking|confirmation|approval)\b` +
  String.raw`|\bdisable[ \t]+(?:the[ \t]+)?(?:sandbox|approvals?)\b`);
const TAMPER = new RegExp(
  String.raw`\.codex/config\.toml|\.claude/settings|\bapproval_policy\b|\bsandbox_mode\b` +
  String.raw`|dangerously-skip-permissions|\bbypasspermissions\b|danger-full-access`);
const NPM_PINNED = /^.+@[0-9]+\.[0-9]+\.[0-9]+/;
const UVX_PINNED = /==[0-9]|^.+@[0-9]/;
const ASCII_SPACE = /[ \t\n\r\f\v]+/;

export function render(f: Finding): string {
  const loc = f.line === 0 ? f.path : `${f.path}:${f.line}`;
  return `${f.severity.padEnd(6)} ${f.rule} ${loc}  ${f.message}`;
}

// 只轉 ASCII 字母，長度不變，比對到的位置可以直接套回原字串
const asciiLower = (s: string) => s.replace(/[A-Z]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 32));

function invisibleKind(cp: number): "zero-width" | "bidi" | "tag" | null {
  if ((cp >= 0x200b && cp <= 0x200d) || cp === 0x2060 || cp === 0xfeff) return "zero-width";
  if ((cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069)) return "bidi";
  if (cp >= 0xe0000 && cp <= 0xe007f) return "tag";
  return null;
}

// 壓縮空白 → 截斷（以 code point 計）→ 把看不見的字元轉成 <U+XXXX>
export function snippet(s: string, limit = 60): string {
  const chars = Array.from(s.split(ASCII_SPACE).filter(Boolean).join(" "));
  const text = chars.slice(0, limit).join("") + (chars.length > limit ? "..." : "");
  let out = "";
  for (const c of text) {
    const cp = c.codePointAt(0)!;
    const hidden = cp < 0x20 || (cp >= 0x7f && cp <= 0x9f) || invisibleKind(cp) !== null;
    out += hidden ? `<U+${cp.toString(16).toUpperCase().padStart(4, "0")}>` : c;
  }
  return out;
}

const endsWithPath = (rel: string, suffix: string) => rel === suffix || rel.endsWith("/" + suffix);

export function isInstruction(rel: string): boolean {
  const name = rel.slice(rel.lastIndexOf("/") + 1);
  if (INSTRUCTION_NAMES.has(name) || endsWithPath(rel, ".github/copilot-instructions.md")) return true;
  return ("/" + rel).includes("/.cursor/rules/") && (name.endsWith(".md") || name.endsWith(".mdc"));
}

const isConfig = (rel: string) => CONFIG_PATHS.some((p) => endsWithPath(rel, p));

// 回傳 [起始行號, 註解內文]；沒有 --> 結尾的註解會一路藏到檔尾
export function hiddenComments(text: string): Array<[number, string]> {
  const found: Array<[number, string]> = [];
  let pos = 0;
  for (let start = text.indexOf("<!--", pos); start >= 0; start = text.indexOf("<!--", pos)) {
    const end = text.indexOf("-->", start + 4);
    const inner = end < 0 ? text.slice(start + 4) : text.slice(start + 4, end);
    pos = end < 0 ? text.length : end + 3;
    if (/\p{L}/u.test(inner)) found.push([text.slice(0, start).split("\n").length, inner]);
  }
  return found;
}

export function invisibleMessage(line: string, skipFirst: boolean): string | null {
  const counts = { "zero-width": 0, bidi: 0, tag: 0 };
  let decoded = "";
  let i = 0;
  for (const c of line) {
    const cp = c.codePointAt(0)!;
    if (!(skipFirst && i++ === 0 && cp === 0xfeff)) { // 檔案開頭的 BOM 是正常的
      const kind = invisibleKind(cp);
      if (kind) {
        counts[kind]++;
        const ascii = cp - 0xe0000; // Unicode Tag → ASCII
        if (kind === "tag" && ascii >= 0x20 && ascii < 0x7f) decoded += String.fromCharCode(ascii);
      }
    }
  }
  const parts: string[] = [];
  if (counts["zero-width"]) parts.push(`zero-width x${counts["zero-width"]}`);
  if (counts.bidi) parts.push(`bidi-control x${counts.bidi}`);
  if (counts.tag) parts.push(`tag-char x${counts.tag} decodes to "${snippet(decoded)}" (ASCII smuggling)`);
  return parts.length ? "invisible characters: " + parts.join(", ") : null;
}

// 把 JSON/TOML 拆成 token，找 npx/bunx/uvx 後面第一個「不是參數也不是 key」的 token 當套件名
export function unpinnedPackages(lines: string[]): Array<[number, string, string]> {
  const tokens: Array<[number, string]> = [];
  lines.forEach((line, i) => {
    for (const t of line.replace(/["',\[\]{}]/g, " ").split(ASCII_SPACE)) if (t) tokens.push([i + 1, t]);
  });
  const result: Array<[number, string, string]> = [];
  tokens.forEach(([no, tok], idx) => {
    const runner = tok.slice(tok.lastIndexOf("/") + 1);
    if (!RUNNERS.has(runner)) return;
    const next = tokens.slice(idx + 1).find(([, t]) => !(t.startsWith("-") || t.endsWith(":") || t.endsWith("=") || t === "args"));
    const pinned = runner === "uvx" ? UVX_PINNED : NPM_PINNED;
    if (next && !pinned.test(next[1])) result.push([no, runner, next[1]]);
  });
  return result;
}

export function matchRule(re: RegExp, line: string): string | null {
  const m = re.exec(asciiLower(line));
  return m ? snippet(line.slice(m.index, m.index + m[0].length)) : null;
}

function scanFile(full: string, rel: string): Finding[] {
  const instruction = isInstruction(rel);
  const out: Finding[] = [];
  const add = (severity: Severity, rule: string, line: number, message: string) =>
    out.push({ severity, rule, path: rel, line, message });
  if (instruction) {
    add("INFO", "instruction-file", 0, "agent instruction file (loaded as trusted context)");
    if (path.resolve(full).split(path.sep).includes("Downloads")) {
      add("HIGH", "risky-location", 0, "instruction file in a Downloads folder (web-writable; do not start an agent here)");
    }
  } else {
    add("INFO", "config-file", 0, "agent config file");
  }
  if (statSync(full).size > MAX_SIZE) return out;
  // ignoreBOM: true 才會保留 BOM，和其他兩個版本一致；無效 byte 自動換成 U+FFFD
  const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(readFileSync(full));
  const lines = text.split("\n");
  const rules: Array<[Severity, string, RegExp, string]> = [
    ["HIGH", "dangerous-command", DANGEROUS, "dangerous command"],
    ["MEDIUM", "instruction-override", OVERRIDE, "instruction override phrase"],
    ["HIGH", "agent-config-tamper", TAMPER, "touches agent config / permissions"],
  ];
  lines.forEach((line, i) => {
    const msg = invisibleMessage(line, i === 0);
    if (msg) add("HIGH", "invisible-unicode", i + 1, msg);
    if (!instruction) return;
    for (const [sev, rule, re, label] of rules) {
      const hit = matchRule(re, line);
      if (hit) add(sev, rule, i + 1, `${label}: "${hit}"`);
    }
  });
  if (instruction) {
    for (const [no, inner] of hiddenComments(text)) add("MEDIUM", "hidden-html-comment", no, `hidden HTML comment: "${snippet(inner)}"`);
  } else {
    for (const [no, runner, pkg] of unpinnedPackages(lines)) {
      add("MEDIUM", "mcp-unpinned-package", no, `${runner} runs "${snippet(pkg)}" without an exact version`);
    }
  }
  return out;
}

export function scan(root: string): { findings: Finding[]; files: number } {
  const findings: Finding[] = [];
  let files = 0;
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) continue; // symlink 一律不跟
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(full);
        continue;
      }
      const rel = path.relative(root, full).split(path.sep).join("/");
      if (!entry.isFile() || !(isInstruction(rel) || isConfig(rel))) continue;
      files++;
      findings.push(...scanFile(full, rel));
    }
  };
  walk(root);
  // 用 UTF-8 byte 比較字串，排序結果才會和 Go / Python 一致
  const cmp = (a: string, b: string) => Buffer.compare(Buffer.from(a), Buffer.from(b));
  findings.sort((a, b) => cmp(a.path, b.path) || a.line - b.line || cmp(a.rule, b.rule) || cmp(a.message, b.message));
  return { findings, files };
}

function main(argv: string[]): number {
  const root = argv[2] ?? ".";
  let isDir = false;
  try { isDir = statSync(root).isDirectory(); } catch { /* 不存在 */ }
  if (!isDir) {
    process.stderr.write(`agent-scan: ${root}: not a directory\n`);
    return 2;
  }
  const { findings, files } = scan(root);
  const count = (s: Severity) => findings.filter((f) => f.severity === s).length;
  const lines = findings.map(render);
  if (findings.length) lines.push("");
  lines.push(`${findings.length} findings (${count("HIGH")} high, ${count("MEDIUM")} medium, ${count("INFO")} info) in ${files} files`);
  process.stdout.write(lines.join("\n") + "\n");
  return count("HIGH") + count("MEDIUM") > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = main(process.argv);
}
