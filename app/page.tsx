"use client";
import { useCallback, useEffect, useState } from "react";
import examsData from "@/data/exams.json";
import questionsData from "@/data/questions.json";
import { AppShell, View } from "@/components/AppShell";
import { Home } from "@/components/Home";
import { Practice } from "@/components/Practice";
import { ExamSetup } from "@/components/ExamSetup";
import { ExamRunner } from "@/components/ExamRunner";
import { Results } from "@/components/Results";
import { HistoryView } from "@/components/HistoryView";
import { ImportQuestions } from "@/components/ImportQuestions";
import { Exam, ExamResult, Question } from "@/lib/types";
import { loadHistory, saveResult } from "@/lib/storage";

const builtInQuestions = questionsData as Question[];
const exams = examsData as Exam[];
const shuffle = <T,>(items:T[]) => [...items].sort(()=>Math.random()-.5);

export default function Page() {
  const [view,setView]=useState<View>("home"); const [selectedExamId,setSelectedExamId]=useState(exams[0].id); const [reveal,setReveal]=useState(false); const [questions,setQuestions]=useState<Question[]>(builtInQuestions); const [examQuestions,setExamQuestions]=useState<Question[]>([]); const [result,setResult]=useState<ExamResult|null>(null); const [history,setHistory]=useState<ExamResult[]>([]);
  const exam = exams.find(item => item.id === selectedExamId) || exams[0];
  const activeQuestions = questions.filter(question => question.examId === exam.id);
  const navigate = useCallback((next: View) => {
    setView(next);
    const hash = next === "home" ? "" : `#${next}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
    window.scrollTo(0, 0);
  }, []);
  useEffect(()=>{
    setHistory(loadHistory());
    const syncFromUrl = () => {
      const candidate = window.location.hash.slice(1) as View;
      const valid: View[] = ["home","practice","setup","exam","result","history","import"];
      setView(valid.includes(candidate) ? candidate : "home");
    };
    syncFromUrl(); window.addEventListener("popstate", syncFromUrl); window.addEventListener("hashchange", syncFromUrl);
    return () => { window.removeEventListener("popstate", syncFromUrl); window.removeEventListener("hashchange", syncFromUrl); };
  },[]);
  const start=()=>{setExamQuestions(shuffle(activeQuestions).slice(0,exam.questionCount));setResult(null);navigate("exam")};
  const finish=useCallback((answers:Record<string,string[]>,elapsedSeconds:number)=>{
    const current=examQuestions; let correct=0; const tagStats:ExamResult["tagStats"]={};
    current.forEach(q=>{const a=answers[q.id]||[];const right=a.length===q.correctChoiceIds.length&&a.every(x=>q.correctChoiceIds.includes(x));if(right)correct++;q.tags.forEach(tag=>{tagStats[tag]??={correct:0,total:0};tagStats[tag].total++;if(right)tagStats[tag].correct++})});
    const next:ExamResult={id:crypto.randomUUID(),examId:exam.id,completedAt:new Date().toISOString(),score:Math.round(correct/current.length*100),correct,total:current.length,elapsedSeconds,tagStats,answers};setResult(next);setHistory(saveResult(next));navigate("result");
  },[examQuestions,navigate,exam.id]);
  let content:React.ReactNode=<Home setView={navigate}/>;
  if(view==="practice")content=<Practice questions={activeQuestions} exam={exam}/>;
  if(view==="setup")content=<ExamSetup exam={exam} reveal={reveal} setReveal={setReveal} start={start}/>;
  if(view==="exam")content=<ExamRunner exam={exam} questions={examQuestions} reveal={reveal} onFinish={finish}/>;
  if(view==="result"&&result)content=<Results result={result} questions={examQuestions} exam={exam} setView={navigate}/>;
  if(view==="history")content=<HistoryView history={history} setHistory={setHistory}/>;
  if(view==="import")content=<ImportQuestions activeCount={questions.length} builtInCount={builtInQuestions.length} onActivate={bank=>setQuestions(bank || builtInQuestions)} setView={navigate}/>;
  return <AppShell view={view} setView={navigate} exams={exams} examId={exam.id} onExamChange={id => { setSelectedExamId(id); navigate("practice"); }}>{content}</AppShell>;
}
