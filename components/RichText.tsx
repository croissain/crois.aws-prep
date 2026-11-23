"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import { formatText, TextKind } from "@/lib/formatText";
import type { TextHighlight } from "@/lib/highlights";

type HastNode = { type: string; value?: string; tagName?: string; properties?: Record<string, unknown>; children?: HastNode[] };

/**
 * Wraps highlighted character ranges in <mark> elements. Offsets count every rendered text node,
 * which matches the region's DOM textContent that captureHighlight measures.
 */
function rehypeMarks({ highlights }: { highlights: TextHighlight[] }) {
  return (tree: HastNode) => {
    const ranges = highlights.filter(h => h.end > h.start).sort((a, b) => a.start - b.start);
    if (!ranges.length) return;
    let full = "";
    const collect = (node: HastNode) => { if (node.type === "text") full += node.value || ""; node.children?.forEach(collect); };
    collect(tree);
    let offset = 0;
    const walk = (node: HastNode) => {
      if (!node.children) return;
      const next: HastNode[] = [];
      for (const child of node.children) {
        if (child.type !== "text") { walk(child); next.push(child); continue; }
        const value = child.value || ""; const start = offset; const end = start + value.length; let cursor = start;
        for (const h of ranges) {
          if (h.end <= cursor || h.start >= end) continue;
          const a = Math.max(cursor, h.start); const b = Math.min(end, h.end);
          if (a > cursor) next.push({ type: "text", value: value.slice(cursor - start, a - start) });
          next.push({ type: "element", tagName: "mark", properties: { dataHid: h.id, dataKind: h.kind || "highlight", dataCopy: full.slice(h.start, h.end), dataFirst: a === h.start ? "1" : "0" }, children: [{ type: "text", value: value.slice(a - start, b - start) }] });
          cursor = b;
        }
        if (cursor < end) next.push({ type: "text", value: value.slice(cursor - start) });
        offset = end;
      }
      node.children = next;
    };
    walk(tree);
  };
}

const highlightLanguages = { json, bash };

/** Answer choices stay plain text unless they carry line breaks or JSON (for example IAM policy choices). */
export const isRichChoice = (text: string) => /\n|[{}]/.test(text);

export function RichText({ text, kind, highlights = [], onRemove, inverted = false }: { text: string; kind: TextKind; highlights?: TextHighlight[]; onRemove?: (id: string) => void; inverted?: boolean }) {
  const markdown = useMemo(() => formatText(text, kind), [text, kind]);
  const copyTimer = useRef<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => () => { if (copyTimer.current !== null) window.clearTimeout(copyTimer.current); if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current); }, []);

  const components = useMemo<Components>(() => ({
    a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()}/>,
    mark: ({ node, children }) => {
      const p = (node?.properties || {}) as Record<string, string>;
      const id = String(p.dataHid); const strike = p.dataKind === "strike";
      return <mark title="Click to copy · Double-click to remove"
        onClick={event => { event.stopPropagation(); if (copyTimer.current !== null) window.clearTimeout(copyTimer.current); copyTimer.current = window.setTimeout(() => { navigator.clipboard.writeText(String(p.dataCopy)).then(() => { setCopied(id); if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current); feedbackTimer.current = window.setTimeout(() => setCopied(null), 900); }).catch(() => undefined); copyTimer.current = null; }, 220); }}
        onMouseDown={event => { if (event.detail > 1) event.preventDefault(); }}
        onDoubleClick={event => { event.preventDefault(); event.stopPropagation(); if (copyTimer.current !== null) window.clearTimeout(copyTimer.current); copyTimer.current = null; setCopied(null); onRemove?.(id); window.getSelection()?.removeAllRanges(); }}
        className={`relative box-decoration-clone cursor-pointer rounded px-0.5 py-0.5 ${strike ? "bg-shu/10 text-inherit line-through decoration-shu/50 decoration-2" : inverted ? "bg-white text-ai" : "bg-ai text-white"}`}>
        {children}
        {copied === id && p.dataFirst === "1" && <span className="copy-float pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 rounded-full bg-sumi px-2.5 py-1 text-[10px] font-medium leading-none text-white shadow-soft dark:bg-white dark:text-sumi">Copied</span>}
      </mark>;
    }
  }), [copied, onRemove, inverted]);

  return <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, { languages: highlightLanguages, detect: false }], [rehypeMarks, { highlights }]]} components={components}>{markdown}</ReactMarkdown>;
}

/** Moves the dyslexia reading guide to the line under the pointer, across paragraphs, list items and code blocks. */
export function moveReadingGuide(event: ReactMouseEvent<HTMLElement>) {
  const root = event.currentTarget;
  const block = (event.target as HTMLElement).closest<HTMLElement>("p, li, pre");
  if (!block || !root.contains(block)) return;
  const rootBox = root.getBoundingClientRect(); const box = block.getBoundingClientRect();
  const lineHeight = Number.parseFloat(getComputedStyle(block).lineHeight) || 28;
  const line = Math.max(0, Math.floor((event.clientY - box.top) / lineHeight));
  root.style.setProperty("--guide-y", `${box.top - rootBox.top + line * lineHeight}px`);
  root.style.setProperty("--guide-h", `${lineHeight}px`);
}
