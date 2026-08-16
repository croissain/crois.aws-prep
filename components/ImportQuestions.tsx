"use client";

import { AlertCircle, Check, Database, Download, FileJson, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Question } from "@/lib/types";
import { convertQuestionBankJson, deleteQuestionBank, saveQuestionBank } from "@/lib/questionBank";
import { View } from "./AppShell";

export function ImportQuestions({ activeCount, builtInCount, onActivate, setView }: { activeCount: number; builtInCount: number; onActivate: (questions: Question[] | null) => void; setView: (view: View) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Question[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const readFile = async (file?: File) => {
    if (!file) return;
    setError(""); setBusy(true);
    try {
      if (!file.name.toLowerCase().endsWith(".json")) throw new Error("Choose a JSON file.");
      const questions = convertQuestionBankJson(await file.text());
      setPreview(questions); setFileName(file.name);
    } catch (cause) {
      setPreview(null); setFileName(""); setError(cause instanceof Error ? cause.message : "The file could not be imported.");
    } finally { setBusy(false); }
  };
  const downloadConverted = () => {
    if (!preview) return;
    const blob = new Blob([`${JSON.stringify(preview, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${fileName.replace(/\.json$/i, "") || "questions"}.crois.json`; anchor.click();
    URL.revokeObjectURL(url);
  };
  const activate = async () => {
    if (!preview) return;
    setBusy(true);
    try { await saveQuestionBank(preview); onActivate(preview); setView("practice"); }
    catch { setError("The browser could not save this question bank."); }
    finally { setBusy(false); }
  };
  const restore = async () => { await deleteQuestionBank(); setPreview(null); setFileName(""); onActivate(null); };

  return <section className="mx-auto max-w-4xl px-5 pb-24 pt-12 lg:px-8 lg:pt-16">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="text-xs tracking-[.18em] text-ai dark:text-[#60a5fa]">QUESTION BANK</span><h1 className="mt-3 text-4xl font-medium tracking-tight">Import questions</h1><p className="mt-3 max-w-xl text-sm leading-6 text-black/50 dark:text-white/50">Use a JSON question bank for Practice and Mock Exam. Processing and storage happen entirely in this browser.</p></div><div className="rounded-full border border-black/10 px-4 py-2 text-xs dark:border-white/10"><Database className="mr-2 inline" size={14}/>{activeCount.toLocaleString()} active</div></div>
    <div className="mt-10 rounded-[2rem] border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[.035] sm:p-9">
      <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={event => { readFile(event.target.files?.[0]); event.currentTarget.value = ""; }}/>
      <button onClick={() => input.current?.click()} disabled={busy} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); readFile(event.dataTransfer.files[0]); }} className="grid min-h-52 w-full place-items-center rounded-2xl border border-dashed border-black/20 p-8 text-center transition hover:border-ai hover:bg-ai/[.025] disabled:opacity-50 dark:border-white/20"><span><span className="mx-auto grid size-12 place-items-center rounded-full bg-ai/10 text-ai dark:text-[#60a5fa]"><Upload size={21}/></span><b className="mt-5 block text-sm">{busy ? "Reading file…" : "Choose or drop a JSON file"}</b><small className="mt-2 block text-black/40 dark:text-white/40">Supports crois.aws-prep JSON and the detected scraper format</small></span></button>
      {error && <div className="mt-5 flex gap-3 rounded-xl bg-shu/10 p-4 text-sm text-shu"><AlertCircle className="shrink-0" size={18}/>{error}</div>}
      {preview && <div className="mt-6 rounded-2xl border border-ai/25 bg-ai/[.045] p-5"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-ai text-white"><Check size={16}/></span><div className="min-w-0 flex-1"><b className="block truncate text-sm">{fileName}</b><p className="mt-1 text-xs text-black/50 dark:text-white/50">{preview.length.toLocaleString()} valid questions · {preview.filter(question => question.multiple).length.toLocaleString()} multiple-answer · {new Set(preview.flatMap(question => question.tags)).size} tags</p><p className="mt-4 line-clamp-2 text-xs leading-5 text-black/55 dark:text-white/55"><FileJson className="mr-1.5 inline" size={13}/>{preview[0].prompt}</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><button onClick={activate} disabled={busy} className="rounded-full bg-ai py-3 text-sm font-medium text-white disabled:opacity-50">Use this question bank</button><button onClick={downloadConverted} className="flex items-center justify-center gap-2 rounded-full border border-ai/30 py-3 text-sm font-medium text-ai"><Download size={16}/>Download converted JSON</button></div></div>}
    </div>
    <div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-black/10 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center"><div><b className="text-sm">Built-in sample bank</b><p className="mt-1 text-xs text-black/45 dark:text-white/45">{builtInCount} original sample questions</p></div><button onClick={restore} className="flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-xs text-shu dark:border-white/10"><Trash2 size={14}/>Restore samples</button></div>
  </section>;
}
