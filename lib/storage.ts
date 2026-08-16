import { ExamResult } from "./types";

const KEY = "kumogaku:exam-history";

export function loadHistory(): ExamResult[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveResult(result: ExamResult) {
  const next = [result, ...loadHistory()].slice(0, 3);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearHistory() { localStorage.removeItem(KEY); }

export function exportResult(result: ExamResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `SAA-C03-result-${result.completedAt.slice(0, 10)}.json`; a.click();
  URL.revokeObjectURL(url);
}
