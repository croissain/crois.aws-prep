"use client";
import { Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Copy, Eraser, Highlighter, MousePointer2, NotebookPen, Search, Strikethrough, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Exam, Question } from "@/lib/types";
import { loadBookmarks, saveBookmarks } from "@/lib/bookmarks";
import { HighlightStore, loadHighlights, saveHighlights, TextHighlight } from "@/lib/highlights";
import { loadNotes, NoteStore, saveNotes } from "@/lib/notes";

const rememberedPages = new Map<string, number>();
const PAGE_STORAGE_PREFIX = "crois.aws-prep:page:";

export function Practice({ questions, exam, savedOnly = false }: { questions: Question[]; exam: Exam; savedOnly?: boolean }) {
  const pageKey = `${exam.id}:${savedOnly ? "saved" : "practice"}`;
  const [query, setQuery] = useState(""); const [tag, setTag] = useState("All topics"); const [page, setPage] = useState(() => rememberedPages.get(pageKey) || 1); const [pageSize, setPageSize] = useState(20); const [open, setOpen] = useState<Set<string>>(new Set());
  const previousPageKey = useRef("");
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [highlights, setHighlights] = useState<HighlightStore>({});
  const [notes, setNotes] = useState<NoteStore>({});
  const [guideOpen, setGuideOpen] = useState(false);
  useEffect(() => { setBookmarks(loadBookmarks()); setHighlights(loadHighlights()); setNotes(loadNotes()); }, []);
  const sourceQuestions = useMemo(() => savedOnly ? questions.filter(question => bookmarks.has(question.id)) : questions, [bookmarks, questions, savedOnly]);
  const tags = ["All topics", ...Array.from(new Set(sourceQuestions.flatMap(q => q.tags)))];
  const filtered = useMemo(() => sourceQuestions.filter(q => (tag === "All topics" || q.tags.includes(tag)) && (q.prompt + q.choices.map(c => c.text).join(" ")).toLowerCase().includes(query.toLowerCase())), [sourceQuestions, query, tag]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)); const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    previousPageKey.current = pageKey;
    const stored = Number.parseInt(localStorage.getItem(`${PAGE_STORAGE_PREFIX}${pageKey}`) || "", 10);
    const restored = rememberedPages.get(pageKey) || (Number.isFinite(stored) && stored > 0 ? stored : 1);
    rememberedPages.set(pageKey, restored);
    setPage(restored);
  }, [pageKey]);
  const changePage = (next: number | ((current: number) => number)) => setPage(current => {
    const value = typeof next === "function" ? next(current) : next;
    rememberedPages.set(pageKey, value);
    localStorage.setItem(`${PAGE_STORAGE_PREFIX}${pageKey}`, String(value));
    return value;
  });
  useEffect(() => { if (page > pages) changePage(pages); }, [page, pages]);
  const update = (fn: () => void) => { fn(); changePage(1); };
  return <section className="mx-auto max-w-5xl px-5 pb-24 pt-12 lg:px-8 lg:pt-16">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="text-xs tracking-[.18em] text-ai dark:text-[#60a5fa]">{savedOnly ? "SAVED" : "PRACTICE"}</span><h1 className="mt-3 text-4xl font-medium tracking-tight">{savedOnly ? "Saved questions" : "Practice questions"}</h1><p className="mt-3 text-sm text-black/50 dark:text-white/50">{savedOnly ? "Review the questions you bookmarked on this device." : "Reveal answers as you build understanding at your own pace."}</p></div><div className="font-mono text-sm text-black/45 dark:text-white/45">{filtered.length} / {sourceQuestions.length} questions</div></div>
    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"><label className="search-field col-span-2 flex items-center gap-3 rounded-xl border border-black/10 bg-white/60 px-4 transition focus-within:border-ai focus-within:ring-2 focus-within:ring-ai/20 dark:border-white/10 dark:bg-white/[.035] sm:col-span-1"><Search size={18} className="text-black/35 dark:text-white/35"/><input value={query} onChange={e => update(() => setQuery(e.target.value))} className="h-12 w-full bg-transparent text-sm outline-none focus-visible:!outline-none placeholder:text-black/35 dark:placeholder:text-white/30" placeholder="Search questions"/>{query && <button aria-label="Clear search" onClick={() => update(() => setQuery(""))}><X size={16}/></button>}</label><label className="relative"><select value={tag} onChange={e => update(() => setTag(e.target.value))} className="h-12 w-full appearance-none rounded-xl border border-black/10 bg-white/60 pl-4 pr-10 text-sm outline-none dark:border-white/10 dark:bg-[#1b1d19]">{tags.map(t => <option key={t}>{t}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-4 top-4"/></label><label className="relative"><select aria-label="Questions per page" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); changePage(1); }} className="h-12 w-full appearance-none rounded-xl border border-black/10 bg-white/60 pl-4 pr-10 text-sm outline-none dark:border-white/10 dark:bg-[#1b1d19]">{[5,10,20,50].map(size => <option key={size} value={size}>{size} per page</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-4 top-4"/></label></div>
    <div className="mt-5 xl:-ml-48 xl:grid xl:grid-cols-[11rem_minmax(0,1fr)] xl:gap-4">
      <div aria-label="Highlight controls guide" className="fixed left-0 top-24 z-30 hidden w-fit max-w-[calc(100vw-1rem)] items-start rounded-r-xl border border-l-0 border-black/10 bg-[#f5f3ed]/90 p-1.5 text-[10px] text-black/50 backdrop-blur-xl dark:border-white/10 dark:border-l-0 dark:bg-[#151714]/90 dark:text-white/50 sm:flex xl:sticky xl:left-auto xl:w-full xl:max-w-full xl:self-start xl:rounded-xl xl:border-l xl:p-2.5 dark:xl:border-l">
        <button type="button" aria-label={guideOpen ? "Collapse highlight guide" : "Expand highlight guide"} aria-expanded={guideOpen} onClick={() => setGuideOpen(open => !open)} className="grid size-8 shrink-0 place-items-center rounded-lg text-ai transition hover:bg-ai/10 xl:hidden"><CircleHelp size={16}/></button>
        <div className={`${guideOpen ? "flex" : "hidden"} max-w-[calc(100vw-5rem)] items-center gap-1 overflow-x-auto pr-1 xl:flex xl:w-full xl:flex-col xl:items-stretch xl:overflow-visible xl:pr-0`}>
        <span className="flex shrink-0 items-start gap-2 px-2 py-1.5"><Highlighter size={13} className="mt-0.5 shrink-0 text-ai"/><span className="flex flex-col leading-tight"><b className="font-medium text-black/70 dark:text-white/70">Drag</b><span className="mt-1">Highlight text</span></span></span>
        <span aria-hidden="true" className="h-3 w-px shrink-0 bg-black/10 dark:bg-white/10 xl:h-px xl:w-full"/>
        <span className="flex shrink-0 items-start gap-2 px-2 py-1.5"><Strikethrough size={13} className="mt-0.5 shrink-0 text-ai"/><span className="flex flex-col leading-tight"><b className="font-medium text-black/70 dark:text-white/70">Alt/Option + drag</b><span className="mt-1">Strike an answer</span></span></span>
        <span aria-hidden="true" className="h-3 w-px shrink-0 bg-black/10 dark:bg-white/10 xl:h-px xl:w-full"/>
        <span className="flex shrink-0 items-start gap-2 px-2 py-1.5"><Copy size={13} className="mt-0.5 shrink-0 text-ai"/><span className="flex flex-col leading-tight"><b className="font-medium text-black/70 dark:text-white/70">Click</b><span className="mt-1">Copy highlight</span></span></span>
        <span aria-hidden="true" className="h-3 w-px shrink-0 bg-black/10 dark:bg-white/10 xl:h-px xl:w-full"/>
        <span className="flex shrink-0 items-start gap-2 px-2 py-1.5"><MousePointer2 size={13} className="mt-0.5 shrink-0 text-ai"/><span className="flex flex-col leading-tight"><b className="font-medium text-black/70 dark:text-white/70">Double-click</b><span className="mt-1">Remove highlight</span></span></span>
        <span aria-hidden="true" className="h-3 w-px shrink-0 bg-black/10 dark:bg-white/10 xl:h-px xl:w-full"/>
        <span className="flex shrink-0 items-start gap-2 px-2 py-1.5"><Eraser size={13} className="mt-0.5 shrink-0 text-ai"/><span className="flex flex-col leading-tight"><b className="font-medium text-black/70 dark:text-white/70">Right-click</b><span className="mt-1">Clear question</span></span></span>
        </div>
      </div>
      <div className="space-y-4">{visible.map((q, i) => <QuestionCard key={q.id} q={q} examCode={exam.code} number={(page-1)*pageSize+i+1} selected={answers[q.id] || []} onSelect={selected => setAnswers(current => ({ ...current, [q.id]: selected }))} highlights={highlights[q.id] || []} onHighlight={(region, start, end, kind) => setHighlights(current => updateHighlights(current, q.id, region, start, end, kind))} onRemoveHighlight={id => setHighlights(current => removeHighlight(current, q.id, id))} onClearHighlights={() => setHighlights(current => clearQuestionHighlights(current, q.id))} note={notes[q.id] || ""} onNoteChange={note => setNotes(current => { const next = { ...current, [q.id]: note }; saveNotes(next); return next; })} bookmarked={bookmarks.has(q.id)} onBookmark={() => setBookmarks(current => { const next = new Set(current); next.has(q.id) ? next.delete(q.id) : next.add(q.id); saveBookmarks(next); return next; })} revealed={open.has(q.id)} toggle={() => setOpen(s => { const n = new Set(s); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}/>)}</div>
    </div>
    {!visible.length && <div className="py-24 text-center text-sm text-black/45 dark:text-white/45">{savedOnly ? "No saved questions for this certification yet." : "No questions match your filters."}</div>}
    {pages > 1 && <div className="mt-9 flex flex-wrap items-center justify-center gap-2"><button disabled={page===1} onClick={() => changePage(p=>p-1)} className="rounded-full border border-black/10 px-4 py-2 text-xs disabled:opacity-25 dark:border-white/10"><ChevronLeft className="mr-1 inline" size={14}/>Previous</button>{paginationItems(page, pages).map((item, index) => item === null ? <span key={`ellipsis-${index}`} className="px-1 text-black/35 dark:text-white/35">…</span> : <button key={item} aria-label={`Go to page ${item}`} aria-current={item === page ? "page" : undefined} onClick={() => changePage(item)} className={`grid size-9 place-items-center rounded-full text-xs ${item === page ? "bg-ai text-white" : "border border-black/10 hover:border-ai hover:text-ai dark:border-white/10"}`}>{item}</button>)}<button disabled={page===pages} onClick={() => changePage(p=>p+1)} className="rounded-full border border-black/10 px-4 py-2 text-xs disabled:opacity-25 dark:border-white/10">Next<ChevronRight className="ml-1 inline" size={14}/></button><label className="ml-1 flex items-center gap-2 text-xs text-black/45 dark:text-white/45"><span>Page</span><span className="relative"><select aria-label="Jump to page" value={page} onChange={event => { changePage(Number(event.target.value)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="appearance-none rounded-full border border-black/10 bg-white/70 py-2 pl-3 pr-8 font-mono text-sumi outline-none dark:border-white/10 dark:bg-[#1b1d19] dark:text-white">{Array.from({ length: pages }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select><ChevronDown aria-hidden="true" size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"/></span></label></div>}
  </section>;
}

function QuestionCard({ q, examCode, number, selected, onSelect, highlights, onHighlight, onRemoveHighlight, onClearHighlights, note, onNoteChange, bookmarked, onBookmark, revealed, toggle }: { q: Question; examCode: string; number: number; selected: string[]; onSelect: (selected: string[]) => void; highlights: TextHighlight[]; onHighlight: (region: string, start: number, end: number, kind: "highlight" | "strike") => void; onRemoveHighlight: (id: string) => void; onClearHighlights: () => void; note: string; onNoteChange: (note: string) => void; bookmarked: boolean; onBookmark: () => void; revealed: boolean; toggle: () => void }) {
  const [copied, setCopied] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const suppressChoiceClick = useRef(false);
  const copyQuestion = async () => {
    const answer = q.correctChoiceIds.map(id => `${id.toUpperCase()}. ${q.choices.find(choice => choice.id === id)?.text}`).join("\n");
    const text = [
      `AWS ${examCode} Practice Question ${number}`, "", q.prompt, "",
      ...q.choices.map(choice => `${choice.id.toUpperCase()}. ${choice.text}`), "",
      `Correct answer${q.correctChoiceIds.length > 1 ? "s" : ""}:`, answer, "",
      `Explanation: ${q.explanation}`, `Topics: ${q.tags.join(", ")}`
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const choose = (id: string) => {
    if (revealed) return;
    onSelect(q.multiple ? (selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id]) : [id]);
  };
  const correct = selected.length === q.correctChoiceIds.length && selected.every(id => q.correctChoiceIds.includes(id));

  return <article onContextMenu={event => { if ((event.target as HTMLElement).closest("textarea, input" ) || !highlights.length) return; event.preventDefault(); window.getSelection()?.removeAllRanges(); onClearHighlights(); }} onMouseUp={event => { const captured = captureHighlight(event.currentTarget); if (captured) { suppressChoiceClick.current = true; const kind = event.altKey && captured.region.startsWith("choice:") ? "strike" : "highlight"; onHighlight(captured.region, captured.start, captured.end, kind); window.setTimeout(() => { suppressChoiceClick.current = false; }, 0); } }} className="relative sm:mr-10">
    <div className="pointer-events-none absolute bottom-4 left-full top-0 z-20 hidden w-9 sm:block">
      <button aria-label={noteOpen ? "Close note" : "Open note"} aria-expanded={noteOpen} onClick={() => setNoteOpen(open => !open)} className={`pointer-events-auto sticky top-24 mt-5 grid h-7 w-9 place-items-center rounded-r-full border border-l-0 shadow-soft transition hover:opacity-100 sm:mt-7 ${note.trim() || noteOpen ? "border-ai bg-ai text-white opacity-100" : "border-black/10 bg-white text-black/40 opacity-45 dark:border-white/10 dark:bg-[#242621] dark:text-white/45"}`}><NotebookPen size={14}/></button>
    </div>
    <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white/65 dark:border-white/10 dark:bg-white/[.035] sm:rounded-2xl">
    <div className="p-5 sm:p-7"><div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4"><div className="flex w-full items-center justify-between sm:contents"><span className="font-mono text-xs text-ai dark:text-[#60a5fa] sm:pt-1.5">Q.{String(number).padStart(2,"0")}</span><div className="flex items-center gap-1.5 sm:hidden"><button aria-label={bookmarked ? "Remove bookmark" : "Save question"} aria-pressed={bookmarked} onClick={onBookmark} className={`grid size-8 place-items-center rounded-full border transition ${bookmarked ? "border-ai bg-ai text-white" : "border-black/10 text-black/50 dark:border-white/10 dark:text-white/50"}`}><Bookmark size={13} fill={bookmarked ? "currentColor" : "none"}/></button><button aria-label="Copy question for research" onClick={copyQuestion} className={`grid size-8 place-items-center rounded-full border transition ${copied ? "border-ai bg-ai text-white" : "border-black/10 text-black/50 dark:border-white/10 dark:text-white/50"}`}><Copy size={13}/></button><button aria-label={noteOpen ? "Close note" : "Open note"} aria-expanded={noteOpen} onClick={() => setNoteOpen(open => !open)} className={`grid size-8 place-items-center rounded-full border transition ${note.trim() || noteOpen ? "border-ai bg-ai text-white" : "border-black/10 text-black/50 dark:border-white/10 dark:text-white/50"}`}><NotebookPen size={13}/></button></div></div><div className="w-full flex-1">
      <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-4">{q.tags.map(tag => <span key={tag} className="rounded-full bg-ai px-2.5 py-1 text-[10px] text-white">{tag}</span>)}{q.multiple && <span className="rounded-full border border-black/[.06] bg-black/[.035] px-2.5 py-1 text-[10px] text-black/40 dark:border-white/[.06] dark:bg-white/[.045] dark:text-white/35">Multiple answer</span>}<button aria-label={bookmarked ? "Remove bookmark" : "Save question"} aria-pressed={bookmarked} onClick={onBookmark} className={`ml-auto hidden size-7 place-items-center rounded-full border transition sm:grid ${bookmarked ? "border-ai bg-ai text-white" : "border-black/10 text-black/40 hover:border-ai hover:text-ai dark:border-white/10 dark:text-white/40"}`}><Bookmark size={13} fill={bookmarked ? "currentColor" : "none"}/></button><button onClick={copyQuestion} className="hidden items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-[10px] text-black/50 transition hover:border-ai hover:text-ai dark:border-white/10 dark:text-white/50 sm:flex"><Copy size={12}/>{copied ? "Copied" : "Copy for research"}</button></div>
      <p data-highlight-region="prompt" onMouseMove={event => { const bounds = event.currentTarget.getBoundingClientRect(); const lineHeight = Number.parseFloat(getComputedStyle(event.currentTarget).lineHeight); const line = Math.floor((event.clientY - bounds.top) / lineHeight); event.currentTarget.style.setProperty("--guide-y", `${line * lineHeight}px`); }} className="reading-guide select-text text-sm font-medium leading-6 sm:text-[15px] sm:leading-7"><HighlightedText text={q.prompt} highlights={highlights.filter(highlight => highlight.region === "prompt")} onRemove={onRemoveHighlight}/></p>
      <div className="mt-5 space-y-2">{q.choices.map(choice => {
        const isSelected = selected.includes(choice.id); const isCorrect = q.correctChoiceIds.includes(choice.id);
        const style = revealed && isCorrect ? "border-ai bg-ai text-white" : revealed && isSelected ? "border-shu bg-shu/[.06]" : isSelected ? "border-ai bg-ai/[.05]" : "border-black/10 hover:border-black/25 dark:border-white/10 dark:hover:border-white/25";
        return <button key={choice.id} onClick={event => { if (suppressChoiceClick.current || (event.target as HTMLElement).closest("mark")) return; choose(choice.id); }} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[13px] leading-5 transition sm:text-sm sm:leading-6 ${style}`}><span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] leading-none ${revealed && isCorrect ? "bg-white text-ai" : revealed && isSelected ? "bg-white text-shu" : isSelected ? "bg-ai text-white" : "bg-black/[.06] dark:bg-white/10"}`}>{revealed && isCorrect ? <Check size={12}/> : choice.id.toUpperCase()}</span><span data-highlight-region={`choice:${choice.id}`} className="select-text"><HighlightedText text={choice.text} highlights={highlights.filter(highlight => highlight.region === `choice:${choice.id}`)} onRemove={onRemoveHighlight} inverted={revealed && isCorrect}/></span></button>;
      })}</div>
    </div></div></div>
    <button onClick={toggle} disabled={!revealed && !selected.length} className="flex w-full items-center justify-center gap-2 border-t border-black/10 py-3.5 text-xs font-medium text-ai hover:bg-black/[.02] disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:text-[#60a5fa] dark:hover:bg-white/[.02]">{revealed ? "Hide result" : "Check answer"}<ChevronDown size={14} className={`transition ${revealed ? "rotate-180" : ""}`}/></button>
    {revealed && <div className={`border-t border-black/10 px-5 py-5 text-sm leading-7 dark:border-white/10 sm:px-7 ${correct ? "bg-ai/[.06]" : "bg-shu/[.045]"}`}><div className={`mb-2 text-xs font-medium ${correct ? "text-ai dark:text-[#60a5fa]" : "text-shu"}`}>{correct ? "Correct" : "Not quite"}</div><b className="mr-3 text-xs text-ai dark:text-[#60a5fa]">Explanation</b><span data-highlight-region="explanation" className="select-text"><HighlightedText text={q.explanation} highlights={highlights.filter(highlight => highlight.region === "explanation")} onRemove={onRemoveHighlight}/></span></div>}
    {noteOpen && <div className="border-t border-black/10 bg-ai/[.035] px-5 py-5 dark:border-white/10 sm:px-7"><div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-medium text-ai dark:text-[#60a5fa]"><NotebookPen size={14}/>Question note</span><span className="text-[10px] text-black/30 dark:text-white/30">Saved locally</span></div><textarea autoFocus value={note} onChange={event => onNoteChange(event.target.value)} placeholder="Write a note for this question…" className="min-h-28 w-full resize-y rounded-xl border border-black/10 bg-white/75 p-4 text-sm leading-6 outline-none transition focus:border-ai focus:ring-2 focus:ring-ai/15 dark:border-white/10 dark:bg-black/15"/></div>}
    </div>
  </article>;
}

function HighlightedText({ text, highlights, onRemove, inverted = false }: { text: string; highlights: TextHighlight[]; onRemove: (id: string) => void; inverted?: boolean }) {
  const copyTimer = useRef<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);
  const [copiedHighlight, setCopiedHighlight] = useState<string | null>(null);
  useEffect(() => () => { if (copyTimer.current !== null) window.clearTimeout(copyTimer.current); if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current); }, []);
  const ordered = [...highlights].filter(highlight => highlight.start < highlight.end && highlight.start < text.length).sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ordered.forEach(highlight => {
    const start = Math.max(cursor, highlight.start);
    const end = Math.min(text.length, highlight.end);
    if (start > cursor) parts.push(<span key={`text-${cursor}`}>{text.slice(cursor, start)}</span>);
    if (end > start) parts.push(<mark key={highlight.id} title="Click to copy · Double-click to remove" onClick={event => { event.stopPropagation(); if (copyTimer.current !== null) window.clearTimeout(copyTimer.current); const value = text.slice(start, end); copyTimer.current = window.setTimeout(() => { navigator.clipboard.writeText(value).then(() => { setCopiedHighlight(highlight.id); if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current); feedbackTimer.current = window.setTimeout(() => setCopiedHighlight(null), 900); }).catch(() => undefined); copyTimer.current = null; }, 220); }} onMouseDown={event => { if (event.detail > 1) event.preventDefault(); }} onDoubleClick={event => { event.preventDefault(); event.stopPropagation(); if (copyTimer.current !== null) window.clearTimeout(copyTimer.current); copyTimer.current = null; setCopiedHighlight(null); onRemove(highlight.id); window.getSelection()?.removeAllRanges(); }} className={`relative box-decoration-clone cursor-pointer rounded px-0.5 py-0.5 ${highlight.kind === "strike" ? "bg-shu/10 text-inherit line-through decoration-shu/50 decoration-2" : inverted ? "bg-white text-ai" : "bg-ai text-white"}`}>{text.slice(start, end)}{copiedHighlight === highlight.id && <span className="copy-float pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 rounded-full bg-sumi px-2.5 py-1 text-[10px] font-medium leading-none text-white shadow-soft dark:bg-white dark:text-sumi">Copied</span>}</mark>);
    cursor = Math.max(cursor, end);
  });
  if (cursor < text.length) parts.push(<span key={`text-${cursor}`}>{text.slice(cursor)}</span>);
  return <>{parts}</>;
}

function captureHighlight(container: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const regionFor = (node: Node) => (node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element)?.closest<HTMLElement>("[data-highlight-region]");
  const startRegion = regionFor(range.startContainer);
  const endRegion = regionFor(range.endContainer);
  if (!startRegion || startRegion !== endRegion || !container.contains(startRegion)) return null;
  const before = document.createRange();
  before.selectNodeContents(startRegion);
  before.setEnd(range.startContainer, range.startOffset);
  const rawStart = before.toString().length;
  const rawEnd = rawStart + range.toString().length;
  const { start, end } = snapToWords(startRegion.textContent || "", rawStart, rawEnd);
  selection.removeAllRanges();
  return end > start ? { region: startRegion.dataset.highlightRegion || "", start, end } : null;
}

function snapToWords(text: string, rawStart: number, rawEnd: number) {
  const isWordCharacter = (character: string | undefined) => Boolean(character && /[\p{L}\p{N}'’-]/u.test(character));
  let start = Math.max(0, Math.min(rawStart, text.length));
  let end = Math.max(start, Math.min(rawEnd, text.length));
  if (isWordCharacter(text[start]) || isWordCharacter(text[start - 1])) {
    while (start > 0 && isWordCharacter(text[start - 1])) start--;
  } else {
    while (start < end && !isWordCharacter(text[start])) start++;
  }
  if (isWordCharacter(text[end - 1])) {
    while (end < text.length && isWordCharacter(text[end])) end++;
  } else {
    while (end > start && !isWordCharacter(text[end - 1])) end--;
  }
  return { start, end };
}

function updateHighlights(current: HighlightStore, questionId: string, region: string, start: number, end: number, kind: "highlight" | "strike" = "highlight") {
  const existing = current[questionId] || [];
  const overlaps = existing.filter(highlight => highlight.region === region && highlight.start <= end && highlight.end >= start);
  const merged: TextHighlight = {
    id: crypto.randomUUID(),
    region,
    start: Math.min(start, ...overlaps.map(highlight => highlight.start)),
    end: Math.max(end, ...overlaps.map(highlight => highlight.end)),
    kind
  };
  const next = { ...current, [questionId]: [...existing.filter(highlight => !overlaps.includes(highlight)), merged] };
  saveHighlights(next);
  return next;
}

function removeHighlight(current: HighlightStore, questionId: string, id: string) {
  const remaining = (current[questionId] || []).filter(highlight => highlight.id !== id);
  const next = { ...current, [questionId]: remaining };
  saveHighlights(next);
  return next;
}

function clearQuestionHighlights(current: HighlightStore, questionId: string) {
  const next = { ...current, [questionId]: [] };
  saveHighlights(next);
  return next;
}

function paginationItems(current: number, total: number): Array<number | null> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, null, total - 1, total];
  if (current >= total - 2) return [1, 2, null, total - 2, total - 1, total];
  return [1, null, current - 1, current, current + 1, null, total];
}
