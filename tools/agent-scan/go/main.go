// agent-scan：在啟動 coding agent 之前，列出 agent 會讀的指令檔 / 設定檔，並標出可疑內容。
//
// 用法：agent-scan [PATH]
// 回傳碼：有 HIGH 或 MEDIUM 為 1，否則 0；PATH 不存在為 2。
package main

import (
	"bufio"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"unicode"
)

const maxSize = 1024 * 1024

var (
	skipDirs         = map[string]bool{".git": true, "node_modules": true, "vendor": true, "dist": true, ".venv": true, "__pycache__": true}
	instructionNames = map[string]bool{"AGENTS.md": true, "CLAUDE.md": true, "GEMINI.md": true, ".cursorrules": true, ".windsurfrules": true, ".clinerules": true}
	configPaths      = []string{".mcp.json", ".claude/settings.json", ".claude/settings.local.json", ".codex/config.toml", ".vscode/mcp.json", ".cursor/mcp.json"}
	runners          = map[string]bool{"npx": true, "bunx": true, "uvx": true}

	// 與 Python / TypeScript 版完全相同的 regex；比對前先把 ASCII 字母轉小寫
	dangerous = regexp.MustCompile(`\b(?:curl|wget)\b[^|]*\|[ \t]*(?:sudo[ \t]+)?(?:ba|z)?sh\b` +
		`|\bbase64[ \t]+(?:-d|--decode)\b[^|]*\|[ \t]*(?:sudo[ \t]+)?(?:ba|z)?sh\b` +
		`|\bnpm[ \t]+(?:i|install)(?:[ \t]+[^ \t]+)*?[ \t]+(?:-g|--global)\b` +
		`|\biex[ \t]*\(|\|[ \t]*iex\b|\binvoke-expression\b`)
	override = regexp.MustCompile(`\bignore[ \t]+(?:all[ \t]+|the[ \t]+)?(?:previous|prior|above)[ \t]+instructions\b` +
		`|\b(?:do[ \t]+not|don't)[ \t]+(?:tell|inform|mention[ \t]+(?:this[ \t]+|it[ \t]+)?to)[ \t]+the[ \t]+user\b` +
		`|\bwithout[ \t]+(?:asking|confirmation|approval)\b` +
		`|\bdisable[ \t]+(?:the[ \t]+)?(?:sandbox|approvals?)\b`)
	tamper = regexp.MustCompile(`\.codex/config\.toml|\.claude/settings|\bapproval_policy\b|\bsandbox_mode\b` +
		`|dangerously-skip-permissions|\bbypasspermissions\b|danger-full-access`)
	tokenSep  = regexp.MustCompile(`["',\[\]{}]`)
	npmPinned = regexp.MustCompile(`^.+@[0-9]+\.[0-9]+\.[0-9]+`)
	uvxPinned = regexp.MustCompile(`==[0-9]|^.+@[0-9]`)
)

type Finding struct {
	Severity, Rule, Path string
	Line                 int // 0 = 整個檔案
	Message              string
}

func (f Finding) String() string {
	loc := f.Path
	if f.Line > 0 {
		loc = fmt.Sprintf("%s:%d", f.Path, f.Line)
	}
	return fmt.Sprintf("%-6s %s %s  %s", f.Severity, f.Rule, loc, f.Message)
}

// 只轉 ASCII 字母：UTF-8 的多位元組字元不會含 ASCII byte，所以位置不變
func asciiLower(s string) string {
	b := []byte(s)
	for i, c := range b {
		if c >= 'A' && c <= 'Z' {
			b[i] = c + 32
		}
	}
	return string(b)
}

func isSpace(r rune) bool { return strings.ContainsRune(" \t\n\r\f\v", r) }

func invisibleKind(r rune) string {
	switch {
	case (r >= 0x200B && r <= 0x200D) || r == 0x2060 || r == 0xFEFF:
		return "zero-width"
	case (r >= 0x202A && r <= 0x202E) || (r >= 0x2066 && r <= 0x2069):
		return "bidi"
	case r >= 0xE0000 && r <= 0xE007F:
		return "tag"
	}
	return ""
}

// 壓縮空白 → 截斷 → 把看不見的字元轉成 <U+XXXX>
func snippet(s string) string {
	runes := []rune(strings.Join(strings.FieldsFunc(s, isSpace), " "))
	text := string(runes)
	if len(runes) > 60 {
		text = string(runes[:60]) + "..."
	}
	var out strings.Builder
	for _, r := range text {
		if r < 0x20 || (r >= 0x7F && r <= 0x9F) || invisibleKind(r) != "" {
			fmt.Fprintf(&out, "<U+%04X>", r)
		} else {
			out.WriteRune(r)
		}
	}
	return out.String()
}

func endsWithPath(rel, suffix string) bool {
	return rel == suffix || strings.HasSuffix(rel, "/"+suffix)
}

func isInstruction(rel string) bool {
	name := rel[strings.LastIndex(rel, "/")+1:]
	if instructionNames[name] || endsWithPath(rel, ".github/copilot-instructions.md") {
		return true
	}
	return strings.Contains("/"+rel, "/.cursor/rules/") && (strings.HasSuffix(name, ".md") || strings.HasSuffix(name, ".mdc"))
}

func isConfig(rel string) bool {
	for _, p := range configPaths {
		if endsWithPath(rel, p) {
			return true
		}
	}
	return false
}

type comment struct {
	Line  int
	Inner string
}

// 沒有 --> 結尾的註解會一路藏到檔尾
func hiddenComments(text string) []comment {
	var found []comment
	for pos := 0; ; {
		start := strings.Index(text[pos:], "<!--")
		if start < 0 {
			return found
		}
		start += pos
		inner, end := text[start+4:], strings.Index(text[start+4:], "-->")
		if end >= 0 {
			inner = inner[:end]
			pos = start + 4 + end + 3
		} else {
			pos = len(text)
		}
		if strings.IndexFunc(inner, unicode.IsLetter) >= 0 {
			found = append(found, comment{strings.Count(text[:start], "\n") + 1, inner})
		}
	}
}

func invisibleMessage(line string, skipFirst bool) string {
	counts := map[string]int{}
	var decoded []rune
	for i, r := range line {
		if skipFirst && i == 0 && r == 0xFEFF {
			continue // 檔案開頭的 BOM 是正常的
		}
		if kind := invisibleKind(r); kind != "" {
			counts[kind]++
			if c := r - 0xE0000; kind == "tag" && c >= 0x20 && c < 0x7F {
				decoded = append(decoded, c) // Unicode Tag → ASCII
			}
		}
	}
	var parts []string
	if n := counts["zero-width"]; n > 0 {
		parts = append(parts, fmt.Sprintf("zero-width x%d", n))
	}
	if n := counts["bidi"]; n > 0 {
		parts = append(parts, fmt.Sprintf("bidi-control x%d", n))
	}
	if n := counts["tag"]; n > 0 {
		parts = append(parts, fmt.Sprintf(`tag-char x%d decodes to "%s" (ASCII smuggling)`, n, snippet(string(decoded))))
	}
	if len(parts) == 0 {
		return ""
	}
	return "invisible characters: " + strings.Join(parts, ", ")
}

type unpinned struct {
	Line        int
	Runner, Pkg string
}

// 把 JSON/TOML 拆成 token，找 npx/bunx/uvx 後面第一個「不是參數也不是 key」的 token 當套件名
func unpinnedPackages(lines []string) []unpinned {
	type token struct {
		line int
		text string
	}
	var tokens []token
	for i, line := range lines {
		for _, t := range strings.FieldsFunc(tokenSep.ReplaceAllString(line, " "), isSpace) {
			tokens = append(tokens, token{i + 1, t})
		}
	}
	var result []unpinned
	for idx, tok := range tokens {
		runner := tok.text[strings.LastIndex(tok.text, "/")+1:]
		if !runners[runner] {
			continue
		}
		for _, next := range tokens[idx+1:] {
			t := next.text
			if strings.HasPrefix(t, "-") || strings.HasSuffix(t, ":") || strings.HasSuffix(t, "=") || t == "args" {
				continue
			}
			pinned := npmPinned
			if runner == "uvx" {
				pinned = uvxPinned
			}
			if !pinned.MatchString(t) {
				result = append(result, unpinned{tok.line, runner, t})
			}
			break
		}
	}
	return result
}

func matchRule(re *regexp.Regexp, line string) string {
	if loc := re.FindStringIndex(asciiLower(line)); loc != nil {
		return snippet(line[loc[0]:loc[1]])
	}
	return ""
}

func scanFile(full, rel string, size int64) []Finding {
	instruction := isInstruction(rel)
	var out []Finding
	add := func(sev, rule string, line int, msg string) { out = append(out, Finding{sev, rule, rel, line, msg}) }
	if instruction {
		add("INFO", "instruction-file", 0, "agent instruction file (loaded as trusted context)")
		abs, _ := filepath.Abs(full)
		for _, seg := range strings.Split(abs, string(filepath.Separator)) {
			if seg == "Downloads" {
				add("HIGH", "risky-location", 0, "instruction file in a Downloads folder (web-writable; do not start an agent here)")
				break
			}
		}
	} else {
		add("INFO", "config-file", 0, "agent config file")
	}
	if size > maxSize {
		return out
	}
	data, err := os.ReadFile(full)
	if err != nil {
		return out
	}
	text := string([]rune(string(data))) // 無效的 UTF-8 byte 轉成 U+FFFD
	lines := strings.Split(text, "\n")
	rules := []struct {
		sev, rule string
		re        *regexp.Regexp
		label     string
	}{
		{"HIGH", "dangerous-command", dangerous, "dangerous command"},
		{"MEDIUM", "instruction-override", override, "instruction override phrase"},
		{"HIGH", "agent-config-tamper", tamper, "touches agent config / permissions"},
	}
	for i, line := range lines {
		if msg := invisibleMessage(line, i == 0); msg != "" {
			add("HIGH", "invisible-unicode", i+1, msg)
		}
		if !instruction {
			continue
		}
		for _, r := range rules {
			if hit := matchRule(r.re, line); hit != "" {
				add(r.sev, r.rule, i+1, fmt.Sprintf(`%s: "%s"`, r.label, hit))
			}
		}
	}
	if instruction {
		for _, c := range hiddenComments(text) {
			add("MEDIUM", "hidden-html-comment", c.Line, fmt.Sprintf(`hidden HTML comment: "%s"`, snippet(c.Inner)))
		}
	} else {
		for _, u := range unpinnedPackages(lines) {
			add("MEDIUM", "mcp-unpinned-package", u.Line, fmt.Sprintf(`%s runs "%s" without an exact version`, u.Runner, snippet(u.Pkg)))
		}
	}
	return out
}

func scan(root string) ([]Finding, int, error) {
	var findings []Finding
	files := 0
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil // 讀不到的目錄就略過（和 Python 的 os.walk 行為一致）
		}
		if d.Type()&fs.ModeSymlink != 0 { // WalkDir 本來就不跟 symlink，這裡連檔案也跳過
			return nil
		}
		if d.IsDir() {
			if path != root && skipDirs[d.Name()] {
				return filepath.SkipDir
			}
			return nil
		}
		relOS, _ := filepath.Rel(root, path)
		rel := filepath.ToSlash(relOS)
		if !isInstruction(rel) && !isConfig(rel) {
			return nil
		}
		info, err := d.Info()
		if err != nil {
			return err
		}
		files++
		findings = append(findings, scanFile(path, rel, info.Size())...)
		return nil
	})
	sort.SliceStable(findings, func(i, j int) bool {
		a, b := findings[i], findings[j]
		if a.Path != b.Path {
			return a.Path < b.Path
		}
		if a.Line != b.Line {
			return a.Line < b.Line
		}
		if a.Rule != b.Rule {
			return a.Rule < b.Rule
		}
		return a.Message < b.Message
	})
	return findings, files, err
}

func main() {
	root := "."
	if len(os.Args) > 1 {
		root = os.Args[1]
	}
	if st, err := os.Stat(root); err != nil || !st.IsDir() {
		fmt.Fprintf(os.Stderr, "agent-scan: %s: not a directory\n", root)
		os.Exit(2)
	}
	findings, files, err := scan(root)
	if err != nil {
		fmt.Fprintf(os.Stderr, "agent-scan: %v\n", err)
		os.Exit(2)
	}
	w := bufio.NewWriter(os.Stdout)
	count := map[string]int{}
	for _, f := range findings {
		fmt.Fprintln(w, f)
		count[f.Severity]++
	}
	if len(findings) > 0 {
		fmt.Fprintln(w)
	}
	fmt.Fprintf(w, "%d findings (%d high, %d medium, %d info) in %d files\n",
		len(findings), count["HIGH"], count["MEDIUM"], count["INFO"], files)
	w.Flush()
	if count["HIGH"]+count["MEDIUM"] > 0 {
		os.Exit(1)
	}
}
