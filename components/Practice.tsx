"use client";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Exam, Question } from "@/lib/types";

export function Practice({ questions, exam }: { questions: Question[]; exam: Exam }) {
  const [query, setQuery] = useState(""); const [tag, setTag] = useState("All topics"); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10); const [open, setOpen] = useState<Set<string>>(new Set());
  const tags = ["All topics", ...Array.from(new Set(questions.flatMap(q => q.tags)))];
  const filtered = useMemo(() => questions.filter(q => (tag === "All topics" || q.tags.includes(tag)) && (q.prompt + q.choices.map(c => c.text).join(" ")).toLowerCase().includes(query.toLowerCase())), [questions, query, tag]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)); const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const update = (fn: () => void) => { fn(); setPage(1); };
  return <section className="mx-auto max-w-5xl px-5 pb-24 pt-12 lg:px-8 lg:pt-16">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="text-xs tracking-[.18em] text-ai dark:text-[#60a5fa]">PRACTICE</span><h1 className="mt-3 text-4xl font-medium tracking-tight">Practice questions</h1><p className="mt-3 text-sm text-black/50 dark:text-white/50">Reveal answers as you build understanding at your own pace.</p></div><div className="font-mono text-sm text-black/45 dark:text-white/45">{filtered.length} / {questions.length} questions</div></div>
    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"><label className="col-span-2 flex items-center gap-3 rounded-xl sm:col-span-1 border border-black/10 bg-white/60 px-4 dark:border-white/10 dark:bg-white/[.035]"><Search size={18} className="text-black/35 dark:text-white/35"/><input value={query} onChange={e => update(() => setQuery(e.target.value))} className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-black/35 dark:placeholder:text-white/30" placeholder="Search questions…"/>{query && <button aria-label="Clear search" onClick={() => update(() => setQuery(""))}><X size={16}/></button>}</label><label className="relative"><select value={tag} onChange={e => update(() => setTag(e.target.value))} className="h-12 w-full appearance-none rounded-xl border border-black/10 bg-white/60 pl-4 pr-10 text-sm outline-none dark:border-white/10 dark:bg-[#1b1d19]">{tags.map(t => <option key={t}>{t}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-4 top-4"/></label><label className="relative"><select aria-label="Questions per page" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-12 w-full appearance-none rounded-xl border border-black/10 bg-white/60 pl-4 pr-10 text-sm outline-none dark:border-white/10 dark:bg-[#1b1d19]">{[5,10,20,50].map(size => <option key={size} value={size}>{size} per page</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-4 top-4"/></label></div>
    <div className="mt-7 space-y-4">{visible.map((q, i) => <QuestionCard key={q.id} q={q} examCode={exam.code} number={(page-1)*pageSize+i+1} revealed={open.has(q.id)} toggle={() => setOpen(s => { const n = new Set(s); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}/>)}</div>
    {!visible.length && <div className="py-24 text-center text-sm text-black/45 dark:text-white/45">No questions match your filters.</div>}
    {pages > 1 && <div className="mt-9 flex items-center justify-center gap-4"><button aria-label="Previous page" disabled={page===1} onClick={() => setPage(p=>p-1)} className="grid size-10 place-items-center rounded-full border border-black/10 disabled:opacity-25 dark:border-white/10"><ChevronLeft size={18}/></button><span className="font-mono text-xs text-black/50 dark:text-white/50">{page} / {pages}</span><button aria-label="Next page" disabled={page===pages} onClick={() => setPage(p=>p+1)} className="grid size-10 place-items-center rounded-full border border-black/10 disabled:opacity-25 dark:border-white/10"><ChevronRight size={18}/></button></div>}
  </section>;
}

function QuestionCard({ q, examCode, number, revealed, toggle }: { q: Question; examCode: string; number: number; revealed: boolean; toggle: () => void }) {
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
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
    setSelected(current => q.multiple ? (current.includes(id) ? current.filter(value => value !== id) : [...current, id]) : [id]);
  };
  const correct = selected.length === q.correctChoiceIds.length && selected.every(id => q.correctChoiceIds.includes(id));

  return <article className="overflow-hidden rounded-2xl border border-black/10 bg-white/65 dark:border-white/10 dark:bg-white/[.035]">
    <div className="p-5 sm:p-7"><div className="flex items-start gap-4"><span className="font-mono text-xs text-ai dark:text-[#60a5fa]">Q.{String(number).padStart(2,"0")}</span><div className="flex-1">
      <div className="mb-4 flex flex-wrap items-center gap-2">{q.tags.map(tag => <span key={tag} className="rounded-full bg-black/[.045] px-2.5 py-1 text-[10px] text-black/50 dark:bg-white/[.06] dark:text-white/50">{tag}</span>)}{q.multiple && <span className="rounded-full bg-shu/10 px-2.5 py-1 text-[10px] text-shu">Multiple answer</span>}<button onClick={copyQuestion} className="ml-auto flex items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-[10px] text-black/50 transition hover:border-ai hover:text-ai dark:border-white/10 dark:text-white/50"><Copy size={12}/>{copied ? "Copied" : "Copy for research"}</button></div>
      <p className="text-[15px] font-medium leading-7">{q.prompt}</p>
      <div className="mt-5 space-y-2">{q.choices.map(choice => {
        const isSelected = selected.includes(choice.id); const isCorrect = q.correctChoiceIds.includes(choice.id);
        const style = revealed && isCorrect ? "border-ai bg-ai/[.08]" : revealed && isSelected ? "border-shu bg-shu/[.06]" : isSelected ? "border-ai bg-ai/[.05]" : "border-black/10 hover:border-black/25 dark:border-white/10 dark:hover:border-white/25";
        return <button key={choice.id} onClick={() => choose(choice.id)} className={`flex w-full gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-6 transition ${style}`}><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] ${revealed && isCorrect || isSelected ? "bg-ai text-white" : "bg-black/[.06] dark:bg-white/10"}`}>{revealed && isCorrect ? <Check size={12}/> : choice.id.toUpperCase()}</span>{choice.text}</button>;
      })}</div>
    </div></div></div>
    <button onClick={toggle} disabled={!revealed && !selected.length} className="flex w-full items-center justify-center gap-2 border-t border-black/10 py-3.5 text-xs font-medium text-ai hover:bg-black/[.02] disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:text-[#60a5fa] dark:hover:bg-white/[.02]">{revealed ? "Hide result" : "Check answer"}<ChevronDown size={14} className={`transition ${revealed ? "rotate-180" : ""}`}/></button>
    {revealed && <div className={`border-t border-black/10 px-5 py-5 text-sm leading-7 dark:border-white/10 sm:px-7 ${correct ? "bg-ai/[.06]" : "bg-shu/[.045]"}`}><div className={`mb-2 text-xs font-medium ${correct ? "text-ai dark:text-[#60a5fa]" : "text-shu"}`}>{correct ? "Correct" : "Not quite"}</div><b className="mr-3 text-xs text-ai dark:text-[#60a5fa]">Explanation</b>{q.explanation}</div>}
  </article>;
}
