#!/usr/bin/env python3
"""agent-scan：在啟動 coding agent 之前，列出 agent 會讀的指令檔 / 設定檔，並標出可疑內容。

用法：python3 agent_scan.py [PATH]
輸出：每行一筆 `SEVERITY rule path:line  message`，最後一行是統計。
回傳碼：有 HIGH 或 MEDIUM 為 1，否則 0；PATH 不存在為 2。
"""
from __future__ import annotations

import os
import re
import sys
from dataclasses import dataclass

SKIP_DIRS = {".git", "node_modules", "vendor", "dist", ".venv", "__pycache__"}
INSTRUCTION_NAMES = {"AGENTS.md", "CLAUDE.md", "GEMINI.md", "SKILL.md", ".cursorrules", ".windsurfrules", ".clinerules"}
CONFIG_PATHS = [".mcp.json", ".claude/settings.json", ".claude/settings.local.json",
                ".codex/config.toml", ".vscode/mcp.json", ".cursor/mcp.json"]
MAX_SIZE = 1024 * 1024

# 規則用的 regex：先把每行的 ASCII 字母轉小寫再比對，三種語言的結果才會一致
DANGEROUS = re.compile(
    r"\b(?:curl|wget)\b[^|]*\|[ \t]*(?:sudo[ \t]+)?(?:ba|z)?sh\b"
    r"|\bbase64[ \t]+(?:-d|--decode)\b[^|]*\|[ \t]*(?:sudo[ \t]+)?(?:ba|z)?sh\b"
    r"|\bnpm[ \t]+(?:i|install)(?:[ \t]+[^ \t]+)*?[ \t]+(?:-g|--global)\b"
    r"|\biex[ \t]*\(|\|[ \t]*iex\b|\binvoke-expression\b"
    r"|\b(?:ba|z)?sh[ \t]+-c[ \t]+[\"']?\$\([ \t]*(?:curl|wget)\b", re.ASCII)
OVERRIDE = re.compile(
    r"\bignore[ \t]+(?:all[ \t]+|the[ \t]+)?(?:previous|prior|above)[ \t]+instructions\b"
    r"|\b(?:do[ \t]+not|don't)[ \t]+(?:tell|inform|mention[ \t]+(?:this[ \t]+|it[ \t]+)?to)[ \t]+the[ \t]+user\b"
    r"|\bwithout[ \t]+(?:asking|confirmation|approval)\b"
    r"|\bdisable[ \t]+(?:the[ \t]+)?(?:sandbox|approvals?)\b", re.ASCII)
TAMPER = re.compile(
    r"\.codex/config\.toml|\.claude/settings|\bapproval_policy\b|\bsandbox_mode\b"
    r"|dangerously-skip-permissions|\bbypasspermissions\b|danger-full-access", re.ASCII)
NPM_PINNED = re.compile(r"^.+@[0-9]+\.[0-9]+\.[0-9]+")
UVX_PINNED = re.compile(r"==[0-9]|^.+@[0-9]")
RUNNERS = {"npx", "bunx", "uvx"}


@dataclass
class Finding:
    severity: str
    rule: str
    path: str
    line: int  # 0 = 整個檔案
    message: str

    def render(self) -> str:
        loc = self.path if self.line == 0 else f"{self.path}:{self.line}"
        return f"{self.severity:<6} {self.rule} {loc}  {self.message}"


def ascii_lower(s: str) -> str:
    # 只轉 ASCII 字母，長度不變，比對到的位置可以直接套回原字串
    return "".join(chr(ord(c) + 32) if "A" <= c <= "Z" else c for c in s)


def invisible_kind(cp: int) -> str | None:
    if 0x200B <= cp <= 0x200D or cp in (0x2060, 0xFEFF):
        return "zero-width"
    if 0x202A <= cp <= 0x202E or 0x2066 <= cp <= 0x2069:
        return "bidi"
    if 0xE0000 <= cp <= 0xE007F:
        return "tag"
    return None


def snippet(s: str, limit: int = 60) -> str:
    # 壓縮空白 → 截斷 → 把看不見的字元轉成 <U+XXXX>，避免輸出本身又藏東西
    chars = list(" ".join(t for t in re.split(r"[ \t\n\r\f\v]+", s) if t))
    text = "".join(chars[:limit]) + ("..." if len(chars) > limit else "")
    out = []
    for c in text:
        cp = ord(c)
        if cp < 0x20 or 0x7F <= cp <= 0x9F or invisible_kind(cp):
            out.append(f"<U+{cp:04X}>")
        else:
            out.append(c)
    return "".join(out)


def ends_with_path(rel: str, suffix: str) -> bool:
    return rel == suffix or rel.endswith("/" + suffix)


def is_instruction(rel: str) -> bool:
    name = rel.rsplit("/", 1)[-1]
    if name in INSTRUCTION_NAMES or ends_with_path(rel, ".github/copilot-instructions.md"):
        return True
    return "/.cursor/rules/" in "/" + rel and name.endswith((".md", ".mdc"))


def is_config(rel: str) -> bool:
    return any(ends_with_path(rel, p) for p in CONFIG_PATHS)


def hidden_comments(text: str) -> list[tuple[int, str]]:
    """回傳 (起始行號, 註解內文)；沒有 --> 結尾的註解會一路藏到檔尾。"""
    found, pos = [], 0
    while (start := text.find("<!--", pos)) >= 0:
        end = text.find("-->", start + 4)
        inner = text[start + 4:] if end < 0 else text[start + 4:end]
        pos = len(text) if end < 0 else end + 3
        if any(c.isalpha() for c in inner):
            found.append((text.count("\n", 0, start) + 1, inner))
    return found


def invisible_message(line: str, skip_first: bool) -> str | None:
    counts = {"zero-width": 0, "bidi": 0, "tag": 0}
    decoded = []
    for i, c in enumerate(line):
        cp = ord(c)
        if skip_first and i == 0 and cp == 0xFEFF:
            continue  # 檔案開頭的 BOM 是正常的
        kind = invisible_kind(cp)
        if kind:
            counts[kind] += 1
            if kind == "tag" and 0x20 <= cp - 0xE0000 < 0x7F:
                decoded.append(chr(cp - 0xE0000))  # Unicode Tag → ASCII
    parts = []
    if counts["zero-width"]:
        parts.append(f"zero-width x{counts['zero-width']}")
    if counts["bidi"]:
        parts.append(f"bidi-control x{counts['bidi']}")
    if counts["tag"]:
        parts.append(f'tag-char x{counts["tag"]} decodes to "{snippet("".join(decoded))}" (ASCII smuggling)')
    return "invisible characters: " + ", ".join(parts) if parts else None


def unpinned_packages(lines: list[str]) -> list[tuple[int, str, str]]:
    """把 JSON/TOML 拆成 token，找 npx/bunx/uvx 後面第一個「不是參數也不是 key」的 token 當套件名。"""
    tokens = []
    for no, line in enumerate(lines, 1):
        cleaned = re.sub(r"[\"',\[\]{}]", " ", line)
        tokens += [(no, t) for t in re.split(r"[ \t\r\f\v]+", cleaned) if t]
    result = []
    for idx, (no, tok) in enumerate(tokens):
        runner = tok.rsplit("/", 1)[-1]
        if runner not in RUNNERS:
            continue
        pkg = next((t for _, t in tokens[idx + 1:]
                    if not (t.startswith("-") or t.endswith((":", "=")) or t == "args")), None)
        pinned = UVX_PINNED if runner == "uvx" else NPM_PINNED
        if pkg is not None and not pinned.search(pkg):
            result.append((no, runner, pkg))
    return result


def match_rule(regex: re.Pattern, line: str) -> str | None:
    m = regex.search(ascii_lower(line))
    return snippet(line[m.start():m.end()]) if m else None


def scan_file(full: str, rel: str) -> list[Finding]:
    instruction = is_instruction(rel)
    out: list[Finding] = []
    if instruction:
        out.append(Finding("INFO", "instruction-file", rel, 0, "agent instruction file (loaded as trusted context)"))
        if "Downloads" in os.path.abspath(full).split(os.sep):
            out.append(Finding("HIGH", "risky-location", rel, 0,
                               "instruction file in a Downloads folder (web-writable; do not start an agent here)"))
    else:
        out.append(Finding("INFO", "config-file", rel, 0, "agent config file"))
    if os.path.getsize(full) > MAX_SIZE:
        return out
    with open(full, "rb") as f:
        text = f.read().decode("utf-8", errors="replace")
    lines = text.split("\n")
    for no, line in enumerate(lines, 1):
        msg = invisible_message(line, skip_first=(no == 1))
        if msg:
            out.append(Finding("HIGH", "invisible-unicode", rel, no, msg))
        if not instruction:
            continue
        for sev, rule, regex, label in (
            ("HIGH", "dangerous-command", DANGEROUS, "dangerous command"),
            ("MEDIUM", "instruction-override", OVERRIDE, "instruction override phrase"),
            ("HIGH", "agent-config-tamper", TAMPER, "touches agent config / permissions"),
        ):
            hit = match_rule(regex, line)
            if hit:
                out.append(Finding(sev, rule, rel, no, f'{label}: "{hit}"'))
    if instruction:
        for no, inner in hidden_comments(text):
            out.append(Finding("MEDIUM", "hidden-html-comment", rel, no, f'hidden HTML comment: "{snippet(inner)}"'))
    else:
        for no, runner, pkg in unpinned_packages(lines):
            out.append(Finding("MEDIUM", "mcp-unpinned-package", rel, no,
                               f'{runner} runs "{snippet(pkg)}" without an exact version'))
    return out


def scan(root: str) -> tuple[list[Finding], int]:
    findings, files = [], 0
    for dirpath, dirnames, filenames in os.walk(root):
        # 原地修改 dirnames 才能讓 os.walk 跳過這些目錄；symlink 一律不跟
        dirnames[:] = [d for d in dirnames
                       if d not in SKIP_DIRS and not os.path.islink(os.path.join(dirpath, d))]
        for name in filenames:
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root).replace(os.sep, "/")
            if os.path.islink(full) or not (is_instruction(rel) or is_config(rel)):
                continue
            files += 1
            findings += scan_file(full, rel)
    findings.sort(key=lambda f: (f.path.encode(), f.line, f.rule, f.message.encode()))
    return findings, files


def main(argv: list[str]) -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    root = argv[1] if len(argv) > 1 else "."
    if not os.path.isdir(root):
        print(f"agent-scan: {root}: not a directory", file=sys.stderr)
        return 2
    findings, files = scan(root)
    for f in findings:
        print(f.render())
    count = {s: sum(f.severity == s for f in findings) for s in ("HIGH", "MEDIUM", "INFO")}
    if findings:
        print()
    print(f"{len(findings)} findings ({count['HIGH']} high, {count['MEDIUM']} medium, "
          f"{count['INFO']} info) in {files} files")
    return 1 if count["HIGH"] or count["MEDIUM"] else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
