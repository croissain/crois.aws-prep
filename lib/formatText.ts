/**
 * Turns the plain, single-line text of scraped questions and explanations into Markdown:
 * paragraphs, bullet lists, the final question on its own line, option references in bold,
 * and JSON, CLI commands, IAM actions, ARNs and links as code or links.
 */

export type TextKind = "prompt" | "explanation" | "choice";

type Token = { kind: "code" | "json" | "url"; value: string };

const OPEN = "";
const CLOSE = "";

const CLI = /\b(?:aws\s+[a-z0-9-]+\s+(?:[a-z]+-[a-z0-9-]+|invoke|sync|cp|ls|mb|rb|mv|rm|deploy|package|wait)|sam\s+(?:local\s+[a-z-]+|build|deploy|sync|init|package|validate|logs|publish|delete|pipeline\s+[a-z-]+)|cdk\s+(?:synth|init|deploy|bootstrap|diff|destroy|watch|ls|import)|eb\s+(?:init|create|deploy|use|swap|clone|config|setenv|status|logs)|docker\s+(?:build|run|push|pull|scan|tag|login))(?:\s+--?[a-z][a-z0-9-]*(?:[ =](?:'[^']*'|"[^"]*"|(?!-)[^\s'",;)]*[^\s'",;).:]))?)*/g;
const URL_RE = /https?:\/\/[^\s<>"'`)\]]*[^\s<>"'`)\].,;:!?]/g;
const INLINE_CODE: RegExp[] = [
  /`[^`\n]+`/g,
  /\$\{[^}\s]+\}/g,
  /\{\{resolve:[^}]+\}\}/g,
  /\barn:aws[a-z-]*:[^\s,;()'"]+[^\s,;()'".:]/g,
  /\b[a-z][a-z0-9-]{1,30}:(?:[A-Z][A-Za-z0-9]*\*?|\*)(?![A-Za-z0-9])/g
];

/** Finds the first JSON object at or after `from` that actually parses. */
function findJson(text: string, from: number): { index: number; length: number; value: unknown } | null {
  for (let start = text.indexOf("{", from); start !== -1; start = text.indexOf("{", start + 1)) {
    let depth = 0; let inString = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inString) { if (ch === "\\") i++; else if (ch === "\"") inString = false; continue; }
      if (ch === "\"") inString = true;
      else if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) {
        const candidate = text.slice(start, i + 1);
        if (!candidate.includes("\":")) break;
        try {
          const value = JSON.parse(candidate);
          const quoted = text[start - 1] === "'" && text[i + 1] === "'";
          return quoted ? { index: start - 1, length: candidate.length + 2, value } : { index: start, length: candidate.length, value };
        } catch { break; }
      }
    }
  }
  return null;
}

/** Replaces code, JSON and URLs with placeholders so sentence splitting and escaping leave them intact. */
function protect(text: string) {
  const tokens: Token[] = [];
  let out = ""; let cursor = 0;
  while (cursor < text.length) {
    let best: { index: number; length: number; token: Token } | null = null;
    const consider = (index: number, length: number, token: Token) => { if (index >= cursor && (!best || index < best.index || (index === best.index && length > best.length))) best = { index, length, token }; };
    for (const re of [CLI, URL_RE, ...INLINE_CODE]) {
      re.lastIndex = cursor;
      const m = re.exec(text);
      if (m) consider(m.index, m[0].length, { kind: re === URL_RE ? "url" : "code", value: m[0].replace(/^`|`$/g, "") });
    }
    const json = findJson(text, cursor);
    if (json) consider(json.index, json.length, { kind: "json", value: JSON.stringify(json.value, null, 2) });
    if (!best) break;
    const found = best as { index: number; length: number; token: Token };
    out += text.slice(cursor, found.index) + OPEN + tokens.length + CLOSE;
    tokens.push(found.token);
    cursor = found.index + found.length;
  }
  return { plain: out + text.slice(cursor), tokens };
}

function escapeMarkdown(text: string) {
  return text.replace(/[\\`*_[\]<>#~|&]/g, "\\$&");
}

function restore(markdown: string, tokens: Token[]) {
  return markdown.replace(new RegExp(`${OPEN}(\\d+)${CLOSE}`, "g"), (_, index: string) => {
    const token = tokens[Number(index)];
    if (token.kind === "url") {
      const url = new URL(token.value);
      const path = url.pathname.replace(/\/$/, "");
      const tail = path.split("/").filter(Boolean).pop();
      const label = `${url.hostname.replace(/^www\./, "")}${tail ? ` › ${decodeURIComponent(tail).replace(/\.html?$/, "")}` : ""}`;
      return `[${escapeMarkdown(label)}](${token.value.replace(/[()\s]/g, encodeURIComponent)})`;
    }
    if (token.kind === "json" && JSON.stringify(JSON.parse(token.value)).length > 60) return `\n\n\`\`\`json\n${token.value}\n\`\`\`\n\n`;
    const fence = token.value.includes("`") ? "``" : "`";
    return `${fence}${token.kind === "json" ? JSON.stringify(JSON.parse(token.value)) : token.value}${fence}`;
  });
}

const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("en", { granularity: "sentence" }) : null;

function sentences(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const parts = segmenter ? Array.from(segmenter.segment(clean), s => s.segment.trim()) : clean.split(/(?<=[.!?])\s+(?=[A-Z(])/);
  // Re-join splits after abbreviations like "e.g." or "i.e.".
  return parts.filter(Boolean).reduce<string[]>((acc, part) => {
    if (acc.length && /\b(?:e\.g|i\.e|etc|vs|approx|Inc|Ltd)\.$/i.test(acc[acc.length - 1])) acc[acc.length - 1] += ` ${part}`;
    else acc.push(part);
    return acc;
  }, []);
}

const OPTION_LEAD = /^(?:\(?[A-F]\)[\s:.-]|[A-F][.:]\s|[A-F]\s?[-=–—]\s|Options?\s+[A-F]\b|Answers?\s+[A-F]\b|Choices?\s+[A-F]\b|[A-F](?:\s*(?:,|and|&)\s*[A-F])*\s+(?:is|are|would|will|does|do|can|could|only|also|isn't|aren't|won't|doesn't|requires?|uses?|adds?)\b|Why not\b|Incorrect\b|Wrong\b|Correct answer\b|Not\s+[A-F]\b)/;

function paragraphs(list: string[], kind: TextKind): string[] {
  const max = kind === "prompt" ? Infinity : 280;
  const out: string[] = []; let current = "";
  for (const sentence of list) {
    const startsOption = kind === "explanation" && OPTION_LEAD.test(sentence);
    if (current && (startsOption || current.length >= max)) { out.push(current); current = ""; }
    current = current ? `${current} ${sentence}` : sentence;
  }
  if (current) out.push(current);
  return out;
}

function emphasize(markdown: string, kind: TextKind) {
  if (kind === "prompt") return markdown;
  return markdown
    .replace(/\b(Options?\s+[A-F](?:(?:\s*,\s*|\s+and\s+|\s+or\s+|\s*&\s*)[A-F]\b)*)(?![A-Za-z])/g, "**$1**")
    .replace(/(^|[\s(])\(([A-F])\)(?=[\s.,;:]|$)/g, "$1**($2)**")
    .replace(/^([A-F])([.:)]|\s?[-=–—])(?=\s)/, "**$1$2**");
}

/** Splits text that uses "•" bullets into intro, list items and any trailing prose. */
function splitBullets(plain: string) {
  if (!plain.includes("•")) return null;
  const [intro, ...items] = plain.split(/\s*•\s*/);
  if (!items.length) return null;
  let trailing = "";
  const last = items[items.length - 1];
  // A bullet list in a prompt often runs straight into the next sentence with no period: "...metadata The company observes...".
  const runOn = last.match(/^(.*?[a-z0-9)])\s+(?=(?:The|This|These|Each|When|Currently|Users|Every|All|Recently|However|After|During|Data|Some|Most)\s)/);
  if (runOn && !/[.!?]$/.test(runOn[1])) { items[items.length - 1] = runOn[1]; trailing = last.slice(runOn[0].length); }
  return { intro, items: items.filter(item => item.trim()), trailing };
}

function block(text: string, tokens: Token[], kind: TextKind) {
  return restore(emphasize(escapeMarkdown(text), kind), tokens);
}

/** Formats one line of text: sentence-based paragraphs, "•" lists and, for prompts, the final question on its own line. */
function formatLine(text: string, kind: TextKind): string {
  const { plain, tokens } = protect(text);
  const bullets = splitBullets(plain);
  const intro = bullets ? bullets.intro : plain;
  const trailing = bullets ? bullets.trailing : "";
  let lead = sentences(intro);
  let tail = sentences(trailing);
  let question: string[] = [];

  if (kind === "prompt") {
    const pool = tail.length ? tail : lead;
    let i = pool.length;
    while (i > 0 && (/\?$/.test(pool[i - 1]) || /^\((?:Choose|Select)\b/i.test(pool[i - 1]) || /^(?:Choose|Select)\s+(?:TWO|THREE|two|three)\b/.test(pool[i - 1]))) i--;
    if (i === pool.length && pool.length > 1 && /^(?:Which|What|How)\b/.test(pool[pool.length - 1])) i = pool.length - 1;
    if (i < pool.length) { question = pool.slice(i); if (pool === tail) tail = tail.slice(0, i); else lead = lead.slice(0, i); }
  }

  const out: string[] = [];
  paragraphs(lead, kind).forEach(p => out.push(block(p, tokens, kind)));
  if (bullets) out.push(bullets.items.map(item => `- ${block(item.trim(), tokens, kind)}`).join("\n"));
  paragraphs(tail, kind).forEach(p => out.push(block(p, tokens, kind)));
  if (question.length) out.push(block(question.join(" "), tokens, kind));
  return out.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

const BULLET_PREFIX = /^\s*[•●▪◦]\s?/;
const LIST_ITEM = /^\s*(?:[•●▪◦]\s*|[-*–]\s+|-(?=[A-Z]))/;

/** A line that belongs to a JSON document: braces, brackets, or a quoted key/value, optionally behind a "•" bullet. */
function isJsonLine(line: string) {
  return /^\s*(?:[{}[\]]|"[^"]*"\s*(?::|,|$|[}\]]))/.test(line.replace(BULLET_PREFIX, ""));
}

/** Pretty-prints a multi-line JSON run, repairing a duplicated opening brace; falls back to the raw lines. */
function jsonFence(code: string) {
  const candidates = [code, code.replace(/^\{\s*\n\s*\{/, "{")];
  for (const candidate of candidates) {
    try { return `\`\`\`json\n${JSON.stringify(JSON.parse(candidate), null, 2)}\n\`\`\``; } catch { /* try next */ }
  }
  const lines = code.split("\n");
  const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^\s*/)?.[0].length ?? 0));
  return `\`\`\`json\n${lines.map(line => line.slice(indent)).join("\n")}\n\`\`\``;
}

function inline(text: string, kind: TextKind) {
  const { plain, tokens } = protect(text.trim());
  return block(plain, tokens, kind);
}

/**
 * Formats text into Markdown. Text that already has line breaks (the preset practice tests) keeps them:
 * each line is a paragraph, bullet lines become lists and JSON spread over lines becomes a code block.
 */
export function formatText(text: string, kind: TextKind): string {
  if (!text) return "";
  if (!text.includes("\n")) return formatLine(text, kind);
  const lines = text.split(/\r?\n/);
  const blocks: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (isJsonLine(line)) {
      let j = i;
      while (j < lines.length && (isJsonLine(lines[j]) || !lines[j].trim())) j++;
      const code = lines.slice(i, j).map(l => l.replace(BULLET_PREFIX, "")).join("\n").trim();
      if (code.includes("{") && code.includes("}")) { blocks.push(jsonFence(code)); i = j; continue; }
    }
    if (LIST_ITEM.test(line)) {
      const items: string[] = [];
      while (i < lines.length && LIST_ITEM.test(lines[i]) && !isJsonLine(lines[i])) { items.push(`- ${inline(lines[i].replace(LIST_ITEM, ""), kind)}`); i++; }
      blocks.push(items.join("\n"));
      continue;
    }
    blocks.push(formatLine(line, kind));
    i++;
  }
  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}
