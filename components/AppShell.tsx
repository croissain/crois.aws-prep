"use client";

import { Bookmark, BookOpen, ChevronDown, Clock3, History, Moon, Sun, Cloud, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Exam } from "@/lib/types";

export type View = "home" | "practice" | "bookmarks" | "setup" | "exam" | "result" | "history" | "import";

export function AppShell({ view, setView, transitionKey, children, exams, examId, onExamChange }: { view: View; setView: (v: View) => void; transitionKey: number; children: React.ReactNode; exams: Exam[]; examId: string; onExamChange: (id: string) => void }) {
  const [dark, setDark] = useState(false);
  const [bootPhase, setBootPhase] = useState<"loading" | "leaving" | "done">("loading");
  useEffect(() => {
    const saved = localStorage.getItem("crois.aws-prep:theme") || localStorage.getItem("kumogaku:theme");
    const next = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(next); document.documentElement.classList.toggle("dark", next);
  }, []);
  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setBootPhase("leaving"), 700);
    const doneTimer = window.setTimeout(() => setBootPhase("done"), 1400);
    return () => { window.clearTimeout(leaveTimer); window.clearTimeout(doneTimer); };
  }, []);
  const toggle = () => { const n = !dark; setDark(n); document.documentElement.classList.toggle("dark", n); localStorage.setItem("crois.aws-prep:theme", n ? "dark" : "light"); };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches("input, select, textarea") || target.isContentEditable || event.metaKey || event.ctrlKey || event.altKey) return;
      const destinations: Record<string, View> = { "1": "practice", "2": "setup", "3": "history", "4": "bookmarks", "5": "import" };
      if (destinations[event.key]) { event.preventDefault(); setView(destinations[event.key]); }
      if (event.key === "/" && ["practice", "bookmarks"].includes(view)) { event.preventDefault(); document.querySelector<HTMLInputElement>('input[placeholder="Search questions"]')?.focus(); }
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!(event.target as HTMLElement).closest("button, select, a")) return;
      const vibrate = navigator.vibrate;
      if (typeof vibrate !== "function") return;
      try { navigator.vibrate(8); } catch { /* Haptics are optional. */ }
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerup", onPointerUp);
    return () => { window.removeEventListener("keydown", onKeyDown); document.removeEventListener("pointerup", onPointerUp); };
  }, [setView, view]);

  return <div className="min-h-screen bg-kinari text-sumi transition-colors dark:bg-[#151714] dark:text-[#f2f0e9]">
    {bootPhase !== "done" && <div className={`loading-curtain ${bootPhase === "leaving" ? "is-leaving" : ""}`} aria-hidden="true"><div className="loading-curtain__top"/><div className="loading-curtain__line"/><div className="loading-curtain__bottom"/></div>}
    {transitionKey > 0 && <div key={transitionKey} className="page-stair" aria-hidden="true">{Array.from({ length: 7 }, (_, index) => <span key={index}/>)}</div>}
    <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-full bg-ai px-4 py-2 text-sm text-white transition focus:translate-y-0">Skip to content</a>
    <header className="progressive-header sticky top-0 z-40">
      <div className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <button onClick={() => setView("home")} className="flex items-center gap-2.5 text-left">
          <span className="grid size-8 place-items-center rounded-full bg-ai text-white"><Cloud size={17} strokeWidth={1.8}/></span>
          <span><b className="block font-semibold leading-none tracking-[.04em]">crois.aws-prep</b><small className="mt-1 block text-[9px] tracking-[.16em] text-black/50 dark:text-white/45">AWS PREP</small></span>
        </button>
        <nav className="hidden items-center gap-1 md:flex">
          <Nav active={view === "practice"} onClick={() => setView("practice")} icon={<BookOpen size={16}/>} text="Practice" />
          <Nav active={["setup","exam","result"].includes(view)} onClick={() => setView("setup")} icon={<Clock3 size={16}/>} text="Mock exam" />
          <Nav active={view === "history"} onClick={() => setView("history")} icon={<History size={16}/>} text="History" />
          <Nav active={view === "bookmarks"} onClick={() => setView("bookmarks")} icon={<Bookmark size={16}/>} text="Saved" />
          <Nav active={view === "import"} onClick={() => setView("import")} icon={<Upload size={16}/>} text="Import" />
        </nav>
        <div className="flex items-center gap-2">
          <label className="relative"><select aria-label="Select certification" value={examId} onChange={event => onExamChange(event.target.value)} className="max-w-32 appearance-none rounded-full border border-black/10 bg-transparent py-1.5 pl-3 pr-9 text-xs text-black/60 outline-none dark:border-white/10 dark:text-white/60 sm:max-w-none">{exams.map(exam => <option key={exam.id} value={exam.id} className="text-sumi">{exam.code}</option>)}</select><ChevronDown aria-hidden="true" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/45 dark:text-white/45"/></label>
          <button aria-label="Toggle theme" onClick={toggle} className="grid size-9 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>
        </div>
      </div>
    </header>
    <main id="main-content" tabIndex={-1}>{children}</main>
    {!(["exam"].includes(view)) && <footer className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-black/10 px-5 py-8 text-xs text-black/45 dark:border-white/10 dark:text-white/40 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© 2026 crois.aws-prep - Make with goût by croissain</span><span>AWS and related marks are trademarks of Amazon.com, Inc.</span></footer>}
    <nav className="fixed inset-x-3 bottom-3 z-50 flex justify-around rounded-2xl border border-black/10 bg-white/90 p-1.5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[#23251f]/95 md:hidden">
      <MobileNav active={view === "practice"} onClick={() => setView("practice")} icon={<BookOpen size={18}/>} text="Practice" />
      <MobileNav active={["setup","exam","result"].includes(view)} onClick={() => setView("setup")} icon={<Clock3 size={18}/>} text="Exam" />
      <MobileNav active={view === "history"} onClick={() => setView("history")} icon={<History size={18}/>} text="History" />
      <MobileNav active={view === "bookmarks"} onClick={() => setView("bookmarks")} icon={<Bookmark size={18}/>} text="Saved" />
      <MobileNav active={view === "import"} onClick={() => setView("import")} icon={<Upload size={18}/>} text="Import" />
    </nav>
  </div>;
}

function Nav({ active, onClick, icon, text }: { active: boolean; onClick: () => void; icon: React.ReactNode; text: string }) {
  return <button onClick={onClick} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${active ? "bg-ai text-white" : "text-black/55 hover:bg-black/5 dark:text-white/55 dark:hover:bg-white/5"}`}>{icon}{text}</button>;
}
function MobileNav({ active, onClick, icon, text }: { active: boolean; onClick: () => void; icon: React.ReactNode; text: string }) {
  return <button onClick={onClick} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] ${active ? "bg-ai text-white" : "text-black/50 dark:text-white/50"}`}>{icon}{text}</button>;
}
