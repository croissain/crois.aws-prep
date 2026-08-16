import { ArrowRight, BookOpen, Check, Clock3, History, Layers3 } from "lucide-react";
import { View } from "./AppShell";

export function Home({ setView }: { setView: (v: View) => void }) {
  return <>
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
      <div className="grid items-end gap-12 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <div className="mb-7 flex items-center gap-3 text-xs tracking-[.16em] text-ai dark:text-[#60a5fa]"><span className="h-px w-8 bg-current"/>AWS CERTIFICATION STUDY</div>
          <h1 className="max-w-3xl text-balance text-5xl font-medium leading-[1.12] tracking-[-.045em] sm:text-6xl lg:text-7xl">Your path to passing,<br/><span className="text-ai dark:text-[#60a5fa]">one question at a time.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-black/55 dark:text-white/55">Prepare for AWS Solutions Architect Associate and Developer Associate. Build understanding at your own pace, then train under real exam pressure.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => setView("practice")} className="group flex items-center justify-between gap-10 rounded-full bg-ai px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#0757d9]">Start practicing <ArrowRight className="transition group-hover:translate-x-1" size={17}/></button>
            <button onClick={() => setView("setup")} className="flex items-center justify-between gap-10 rounded-full border border-black/20 px-6 py-3.5 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5">Take a mock exam <Clock3 size={17}/></button>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] bg-[#e8e4da] p-7 dark:bg-[#242721]">
          <div className="absolute -right-8 -top-8 size-36 rounded-full border border-ai/20"/><div className="absolute -right-2 -top-2 size-20 rounded-full border border-ai/30"/>
          <div className="relative">
            <span className="text-xs text-black/45 dark:text-white/45">Built-in certifications</span>
            <div className="mt-6 rounded-2xl bg-white/55 p-5 dark:bg-black/15"><div className="flex items-end justify-between"><span className="font-mono text-3xl font-light tracking-tight">SAA<span className="text-ai">—</span>C03</span><span className="rounded-full bg-white/70 px-3 py-1 text-[10px] text-ai dark:bg-black/20">1,017 QUESTIONS</span></div><p className="mt-3 text-sm font-medium">Solutions Architect Associate</p></div>
            <div className="mt-3 rounded-2xl bg-white/55 p-5 dark:bg-black/15"><div className="flex items-end justify-between"><span className="font-mono text-3xl font-light tracking-tight">DVA<span className="text-ai">—</span>C02</span><span className="rounded-full bg-white/70 px-3 py-1 text-[10px] text-ai dark:bg-black/20">554 QUESTIONS</span></div><p className="mt-3 text-sm font-medium">Developer Associate</p></div>
            <p className="mt-5 text-xs text-black/45 dark:text-white/40">Choose your certification from the navigation.</p>
          </div>
        </div>
      </div>
    </section>
    <section className="border-y border-black/10 bg-white/45 dark:border-white/10 dark:bg-white/[.025]">
      <div className="mx-auto grid max-w-7xl gap-px px-5 py-14 md:grid-cols-3 lg:px-8">
        <Feature icon={<BookOpen/>} number="01" title="Learn freely" text="Browse every question and reveal answers only when you need them. Find topics quickly with search and tags."/>
        <Feature icon={<Clock3/>} number="02" title="Recreate exam day" text="Practice in a 65-question, 130-minute format, with optional feedback after each answer."/>
        <Feature icon={<History/>} number="03" title="Know your weak spots" text="See accuracy by topic, keep your last three results locally, and export them as JSON."/>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="grid gap-10 rounded-[2rem] bg-sumi px-7 py-10 text-white dark:bg-[#e9e7df] dark:text-sumi md:grid-cols-2 md:p-12"><div><Layers3 className="mb-8 text-[#60a5fa]"/><h2 className="text-3xl tracking-tight">One study system, multiple AWS paths.</h2><p className="mt-4 max-w-md text-sm leading-7 text-white/55 dark:text-black/55">Switch between SAA-C03 and DVA-C02 while keeping the same focused practice, mock exam, and result experience.</p></div><div className="grid content-center gap-3 text-sm"><Line text="1,571 built-in questions across two exams"/><Line text="Your results stay in this browser"/><Line text="Add more exams through simple JSON files"/></div></div></section>
  </>;
}
function Feature({ icon, number, title, text }: { icon: React.ReactNode; number: string; title: string; text: string }) { return <div className="border-b border-black/10 py-7 last:border-0 dark:border-white/10 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"><div className="flex items-center justify-between text-ai dark:text-[#60a5fa]">{icon}<span className="font-mono text-xs">{number}</span></div><h3 className="mt-8 text-xl font-medium">{title}</h3><p className="mt-3 text-sm leading-7 text-black/50 dark:text-white/50">{text}</p></div> }
function Line({ text }: { text: string }) { return <div className="flex items-center gap-3 border-b border-white/10 py-3 last:border-0 dark:border-black/10"><span className="grid size-5 place-items-center rounded-full bg-[#60a5fa] text-sumi"><Check size={12}/></span>{text}</div> }
